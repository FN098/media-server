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

export type DeleteNodesResult =
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

export type DeleteNodesSuccess = Extract<DeleteNodesResult, { success: true }>;

// 削除（ゴミ箱フォルダへの移動）
export async function deleteNodesAction(
  sourcePaths: string[]
): Promise<DeleteNodesResult> {
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

  const completed: DeleteNodesSuccess["completed"] = [];
  const failed: DeleteNodesSuccess["failed"] = [];
  const skipped: DeleteNodesSuccess["skipped"] = [];

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

    // ゴミ箱に移動しても仮想パスは変わらない（物理パスのみ変更）
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaTrashPath(destVirtualPath);

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
      (!isDirectory && !hasPermission(user, "file:delete")) ||
      (isDirectory && !hasPermission(user, "folder:delete"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    // 移動先フォルダ作成
    try {
      await mkdir(dirname(destRealPath), { recursive: true });
    } catch (e) {
      logger.error("action:delete:create-direcory", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:delete:move", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // DB更新不要：.trash フォルダへの移動のみ
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
