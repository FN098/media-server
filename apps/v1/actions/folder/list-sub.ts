"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isBlockedVirtualPath } from "@/lib/path/protections";
import { isFsNotFoundError, isFsPermissionError } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { Dirent } from "fs";
import { readdir } from "fs/promises";

type ListSubDirectoriesResult =
  | {
      success: true;
      folders: { name: string; path: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// サブフォルダ一覧
export async function listSubFoldersAction(
  dirPath: string
): Promise<ListSubDirectoriesResult> {
  // 入力バリデーション＋正規化
  let normalizedDirPath = isRootPath(dirPath) ? dirPath : null;

  // ルートの場合は正規化スキップ
  if (normalizedDirPath == null) {
    if (!dirPath) {
      return {
        success: false,
        message: "処理対象のパスが指定されていません。",
      };
    }

    const parsed = {
      dirPath: VirtualPathSchema.safeParse(sanitize(dirPath)),
    };

    if (!parsed.dirPath.success) {
      return {
        success: false,
        message: "入力エラーがあります。",
        errors: [{ prop: "dirPath", issues: parsed.dirPath.error?.issues }],
      };
    }

    normalizedDirPath = parsed.dirPath.data;
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "folder:list")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // フォルダ保護
  if (isBlockedVirtualPath(normalizedDirPath)) {
    return {
      success: false,
      message: "このフォルダにはアクセスできません。",
    };
  }

  // 仮想パス→物理パス
  const realDirPath = getServerMediaPath(normalizedDirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realDirPath, { withFileTypes: true });
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return {
        success: false,
        message: "フォルダが見つかりません。",
      };
    }
    if (isFsPermissionError(e)) {
      return {
        success: false,
        message: "フォルダへのアクセス権がありません。",
      };
    }
    logger.error("action:list-sub-folders", e);
    return {
      success: false,
      message: "ファイル一覧の取得に失敗しました。",
    };
  }

  return {
    success: true,
    folders: entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: sanitize(join(normalizedDirPath, e.name)),
      }))
      .filter((e) => !isBlockedVirtualPath(e.path)),
  };
}
