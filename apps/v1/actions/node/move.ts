"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { renameNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { unique } from "@/lib/utils/array";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { basename, extname, join } from "@/lib/virtual-path/path";
import {
  EditableVirtualPathManySchema,
  EditableVirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import { readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z
  .object({
    sourcePaths: EditableVirtualPathManySchema.min(
      1,
      "ファイルまたはフォルダを1件以上指定してください。"
    ).transform((paths) => unique(paths)),

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

// 移動
export async function moveManyNodesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePaths, destDirPath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:move-many", "folder:move-many");
  if (!auth.success) {
    return auth;
  }

  // 仮想パス→物理パス
  const realDestDirPath = getServerMediaPath(destDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(realDestDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (e) {
    logger.error("action:move:read-directory", e);
    return {
      success: false,
      message: "ファイルまたはフォルダの移動に失敗しました。",
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
    const destVirtualPath = join(destDirPath, currentSrcName);
    const destRealPath = getServerMediaPath(destVirtualPath);

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイル移動前処理
    try {
      await rm(destThumbPath, { recursive: true, force: true });
    } catch (e) {
      logger.error("action:move:thumb-preprocess", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    // サムネイル移動
    let thumbMoved = false;
    try {
      await rename(srcThumbPath, destThumbPath);
      thumbMoved = true;
    } catch (e) {
      // not found （未作成）の場合は処理継続、それ以外は失敗
      if (!isFsNotFoundError(e)) {
        logger.error("action:move:thumb", e);
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダの移動に失敗しました。",
        });
        continue;
      }
    }

    // FS移動
    try {
      await rename(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:move:fs", e);

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (e) {
          logger.error("action:move:fs:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    // DB更新
    try {
      await renameNodeInDb({ srcVirtualPath, destVirtualPath, isDirectory });
    } catch (e) {
      logger.error("action:move:db", e);

      // FSロールバック
      try {
        await rename(destRealPath, srcRealPath);
      } catch (e) {
        logger.error("action:move:db:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (e) {
          logger.error("action:move:db:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
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
