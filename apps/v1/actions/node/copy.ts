"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { copyNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { unique } from "@/lib/utils/array";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { basename, extname } from "@/lib/virtual-path/path";
import {
  VirtualPathManySchema,
  VirtualPathOneSchema,
} from "@/lib/virtual-path/schemas";
import { cp, readdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type CopyNodesResult =
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

type CopyNodesSuccess = Extract<CopyNodesResult, { success: true }>;

// コピー
export async function copyNodesAction(
  sourcePaths: string[],
  destDirPath: string
): Promise<CopyNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0 || !destDirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
    destDirPath: VirtualPathOneSchema.safeParse(sanitize(destDirPath)),
  };
  if (!parsed.sourcePaths.success || !parsed.destDirPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
        { prop: "destDirPath", issues: parsed.destDirPath.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);
  const normalizedDestDirPath = parsed.destDirPath.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 仮想パス→物理パス
  const realDestDirPath = getServerMediaPath(normalizedDestDirPath);

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

  const completed: CopyNodesSuccess["completed"] = [];
  const failed: CopyNodesSuccess["failed"] = [];
  const skipped: CopyNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // 子孫チェック
    if (
      normalizedDestDirPath === srcVirtualPath ||
      normalizedDestDirPath.startsWith(srcVirtualPath + "/")
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "自分自身またはサブフォルダへの操作はできません。",
      });
      continue;
    }

    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

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

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:copy")) ||
      (isDirectory && !hasPermission(user, "folder:copy"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

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
    const destVirtualPath = `${normalizedDestDirPath}/${currentSrcName}`;
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
