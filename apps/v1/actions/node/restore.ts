"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import {
  getServerMediaPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { unique } from "@/lib/utils/array";
import { getPathInfo, recursiveMergeMove } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { dirname } from "@/lib/virtual-path/path";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";

type RestoreNodesResult =
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

type RestoreNodesSuccess = Extract<RestoreNodesResult, { success: true }>;

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreNodesAction(
  sourcePaths: string[]
): Promise<RestoreNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
  };
  if (!parsed.sourcePaths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const completed: RestoreNodesSuccess["completed"] = [];
  const failed: RestoreNodesSuccess["failed"] = [];
  const skipped: RestoreNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
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

    // ゴミ箱から元のフォルダに移動しても仮想パスは変わらない（物理パスのみ変更）
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);
    const destRealParentPath = dirname(destRealPath);

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
      (!isDirectory && !hasPermission(user, "file:restore")) ||
      (isDirectory && !hasPermission(user, "folder:restore"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    // 移動先フォルダ作成
    try {
      await mkdir(destRealParentPath, { recursive: true });
    } catch (e) {
      logger.error("action:restore:create-direcory", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:restore:move", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // DB更新不要：元のフォルダへの移動のみ

    completed.push({ path: srcVirtualPath });
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
    revalidatePath("/trash");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
