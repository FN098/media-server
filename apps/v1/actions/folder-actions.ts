"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import {
  getRecentFolders,
  togglePinVisitedFolder,
  updateVisitedFolder,
} from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isBlockedVirtualPath } from "@/lib/path/protections";
import {
  existsPath,
  isFsNotFoundError,
  isFsPermissionError,
} from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { basename, join } from "@/lib/virtual-path/path";
import {
  FolderNameSchema,
  VirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import { Dirent } from "fs";
import { mkdir, readdir } from "fs/promises";
import { revalidatePath } from "next/cache";

type VisitFolderResult =
  | { success: true }
  | {
      success: false;
      message: string;
    };

// フォルダ訪問履歴更新
export async function visitFolderAction(
  dirPath: string
): Promise<VisitFolderResult> {
  // 入力バリデーション＋正規化
  if (!dirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const normalizedDirPath = VirtualPathSchema.safeParse(sanitize(dirPath)).data;
  if (!normalizedDirPath) {
    return {
      success: false,
      message: `無効なパスです。: ${dirPath}`,
    };
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
  if (!hasPermission(user, "folder:update-history")) {
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

  try {
    await updateVisitedFolder(normalizedDirPath, user.id);
  } catch (e) {
    logger.error("action:update-folder-history", e);
    return {
      success: false,
      message: "訪問済みフォルダの更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}

type CreateFolderResult =
  | { success: true }
  | {
      success: false;
      message: string;
    };

// フォルダ作成
export async function createFolderAction(
  parentPath: string,
  folderName: string
): Promise<CreateFolderResult> {
  // 入力バリデーション＋正規化
  if (!parentPath || !folderName) {
    return {
      success: false,
      message: "処理対象のパスまたはフォルダ名が指定されていません。",
    };
  }

  const normalizedParentPath = VirtualPathSchema.safeParse(
    sanitize(parentPath)
  ).data;
  if (!normalizedParentPath) {
    return {
      success: false,
      message: `無効なパスです。: ${parentPath}`,
    };
  }

  const normalizedFolderName = FolderNameSchema.safeParse(
    sanitize(folderName)
  ).data;
  if (!normalizedFolderName) {
    return {
      success: false,
      message: `無効なフォルダ名です。: ${folderName}`,
    };
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
  if (!hasPermission(user, "folder:create")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // フォルダ保護
  if (isBlockedVirtualPath(normalizedParentPath)) {
    return {
      success: false,
      message: "このフォルダにはアクセスできません。",
    };
  }

  const newVirtualPath = join(normalizedParentPath, normalizedFolderName);
  const newRealPath = getServerMediaPath(newVirtualPath);

  if (await existsPath(newRealPath)) {
    return {
      success: false,
      message: "同名のフォルダまたはファイルが既に存在します。",
    };
  }

  try {
    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    logger.error("action:create-folder", error);
    return {
      success: false,
      message: "フォルダの作成に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}

type ListRecentFolderResult =
  | {
      success: true;
      data: {
        path: string;
        name: string;
        pinned: boolean;
      }[];
    }
  | {
      success: false;
      message: string;
    };

// 最近訪問したフォルダを取得
export async function listRecentFoldersAction(): Promise<ListRecentFolderResult> {
  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "folder:list-history")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  let folders: Awaited<ReturnType<typeof getRecentFolders>>;
  try {
    folders = await getRecentFolders(user.id, 10);
  } catch (error) {
    logger.error("action:list-folder-history", error);
    return {
      success: false,
      message: "訪問済みフォルダ一覧の取得に失敗しました。",
    };
  }

  return {
    success: true,
    data: folders.map((f) => ({
      path: f.dirPath,
      name: basename(f.dirPath),
      pinned: f.isPinned,
    })),
  };
}

type TogglePinVisitedFolderResult =
  | {
      success: true;
    }
  | { success: false; message: string };

// フォルダ訪問履歴ピン留めトグル
export async function togglePinVisitedFolderAction(
  dirPath: string,
  currentPinned: boolean
): Promise<TogglePinVisitedFolderResult> {
  // 入力バリデーション＋正規化
  if (!dirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const normalizedDirPath = VirtualPathSchema.safeParse(sanitize(dirPath)).data;
  if (!normalizedDirPath) {
    return {
      success: false,
      message: `無効なパスです。: ${dirPath}`,
    };
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
  if (!hasPermission(user, "folder:pin-history")) {
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

  try {
    await togglePinVisitedFolder(user.id, dirPath, currentPinned);
  } catch (error) {
    logger.error("action:toggle-pin-visited-folder", error);
    return {
      success: false,
      message: "訪問済みフォルダのピン留め更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

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
