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
      directories: { name: string; path: string }[];
    }
  | { success: false; message: string };

// サブフォルダ一覧
export async function listSubDirectoriesAction(
  dirPath: string
): Promise<ListSubDirectoriesResult> {
  // 入力バリデーション＋正規化
  let normalizedDirPath: string;
  if (isRootPath(dirPath)) {
    normalizedDirPath = dirPath; // ルートはバリデーションチェック回避
  } else {
    const parsed = VirtualPathSchema.safeParse(sanitize(dirPath));
    if (!parsed.success) {
      return {
        success: false,
        message: `無効なパスです。: ${dirPath}`,
      };
    }
    normalizedDirPath = parsed.data;
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
    logger.error("action:list-sub-directories", e);
    return {
      success: false,
      message: "ファイル一覧の取得に失敗しました。",
    };
  }

  return {
    success: true,
    directories: entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: sanitize(join(dirPath, e.name)),
      }))
      .filter((e) => !isBlockedVirtualPath(e.path)),
  };
}
