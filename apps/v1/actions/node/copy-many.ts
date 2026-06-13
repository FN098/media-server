"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { copyNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { basename, extname } from "@/lib/virtual-path/path";
import {
  EditableVirtualPathManySchema,
  EditableVirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import { cp, readdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z
  .object({
    sourcePaths: EditableVirtualPathManySchema.min(
      1,
      "ファイルまたはフォルダを1件以上指定してください。"
    ),
    destDirPath: EditableVirtualPathSchema,
  })
  .superRefine(({ sourcePaths, destDirPath }, ctx) => {
    for (const sourcePath of sourcePaths) {
      if (
        destDirPath === sourcePath ||
        destDirPath.startsWith(sourcePath + "/")
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["destDirPath"],
          message: "移動先に自分自身またはそのサブフォルダは指定できません。",
        });

        return;
      }
    }
  });

type ActionResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type Success = Extract<ActionResult, { success: true }>;

// コピー
export async function copyManyNodesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePaths, destDirPath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:copy-many", "folder:copy-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // 仮想パス→物理パス
  const realDestDirPath = getServerMediaPath(destDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(realDestDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (e) {
    logger.error("action:copy:read-directory", e);
    return {
      success: false,
      message: "ファイルまたはフォルダのコピーに失敗しました。",
    };
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  for (const srcVirtualPath of sourcePaths) {
    // 仮想パス→物理パス
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    const srcName = basename(srcVirtualPath);

    // 新しい名前を確定（名前衝突があれば (2), (3), ... などの連番を付与）
    let currentSrcName = srcName;
    let counter = 2;
    while (existingNames.has(currentSrcName)) {
      if (isDirectory) {
        // フォルダの場合: 「フォルダ名 (2)」
        currentSrcName = `${srcName} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (2).ext」
        const ext = extname(srcName);
        const base = basename(srcName, ext);
        currentSrcName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 最終的なパスを決定
    const destVirtualPath = `${destDirPath}/${currentSrcName}`;
    const destRealPath = getServerMediaPath(destVirtualPath);

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイルコピー（失敗しても本体コピーは続行）
    let thumbCopied = false;
    try {
      await cp(srcThumbPath, destThumbPath, { recursive: true });
      thumbCopied = true;
    } catch (e) {
      if (!isFsNotFoundError(e)) {
        logger.error("action:copy:thumb", e);
      }
    }

    // FSコピー
    try {
      await cp(srcRealPath, destRealPath, { recursive: true });
    } catch (e) {
      logger.error("action:copy:fs", e);

      // FSロールバック（中途半端なコピー結果を削除）
      try {
        await rm(destRealPath, { recursive: true, force: true });
      } catch (e) {
        logger.error("action:copy:fs:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbCopied) {
        try {
          await rm(destThumbPath, { recursive: true, force: true });
        } catch (e) {
          logger.error("action:copy:fs:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダのコピーに失敗しました。",
      });
      continue;
    }

    // DB更新
    try {
      await copyNodeInDb({
        srcVirtualPath,
        destVirtualPath,
        isDirectory,
        userId: user.id,
      });
    } catch (e) {
      logger.error("action:copy:db", e);

      // FSロールバック（中途半端なコピー結果を削除）
      try {
        await rm(destRealPath, { recursive: true, force: true });
      } catch (e) {
        logger.error("action:copy:db:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbCopied) {
        try {
          await rm(destThumbPath, { recursive: true, force: true });
        } catch (e) {
          logger.error("action:copy:db:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダのコピーに失敗しました。",
      });
      continue;
    }

    completed.push({ path: srcVirtualPath });

    // 次のループのファイルがこれと衝突するのを防ぐため、確定した名前を Set に予約登録
    existingNames.add(currentSrcName);
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
