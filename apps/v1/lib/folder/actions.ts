"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import {
  getRecentFolders,
  togglePinVisitedFolder,
  updateVisitedFolder,
} from "@/lib/folder/repository";
import { getServerMediaPath } from "@/lib/path/helpers";
import {
  isSystemHiddenRealPath,
  isSystemHiddenVirtualPath,
} from "@/lib/path/protections";
import { FolderNameSchema, VirtualPathSchema } from "@/lib/path/schemas";
import {
  existsPath,
  isFsNotFoundError,
  isFsPermissionError,
} from "@/lib/utils/fs";
import { Dirent } from "fs";
import { mkdir, readdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename } from "path";
import { join } from "path/posix";

function normalizeVirtualPath(path: string) {
  return VirtualPathSchema.parse(path);
}

// フォルダ訪問履歴更新
export async function visitFolderAction(dirPath: string): Promise<void> {
  // 認証
  const user = await resolveCurrentUserOrThrow();

  await updateVisitedFolder(dirPath, user.id);

  // キャッシュ更新
  revalidatePath("/dashboard");
}

// フォルダ作成
export async function createFolderAction(
  parentPath: string,
  folderName: string
) {
  // 認証
  await resolveCurrentUserOrThrow();

  // 入力バリデーション+正規化
  const parsedParentPath = VirtualPathSchema.safeParse(parentPath);
  if (!parsedParentPath.success) {
    return {
      success: false,
      error: parsedParentPath.error.issues[0].message,
    };
  }

  const parsedFolderName = FolderNameSchema.safeParse(folderName.trim());
  if (!parsedFolderName.success) {
    return {
      success: false,
      error: parsedFolderName.error.issues[0].message,
    };
  }

  const validParentPath = parsedParentPath.data;
  const validFolderName = parsedFolderName.data;

  const newVirtualPath =
    validParentPath === ""
      ? validFolderName
      : `${validParentPath}/${validFolderName}`;

  const newRealPath = getServerMediaPath(newVirtualPath);

  if (await existsPath(newRealPath)) {
    return {
      success: false,
      error: "同名のフォルダまたはファイルが既に存在します。",
    };
  }

  try {
    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    console.error("failed to create new directory:", error);
    return {
      success: false,
      error: "フォルダ作成中にエラーが発生しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}

// 最近訪問したフォルダを取得
export async function listRecentFoldersAction() {
  // 認証
  const user = await resolveCurrentUserOrThrow();

  let folders: Awaited<ReturnType<typeof getRecentFolders>>;
  try {
    folders = await getRecentFolders(user.id, 10);
  } catch (error) {
    console.error("Get Recent Folders Error:", error);
    return {
      success: false,
      error: "フォルダ取得中にエラーが発生しました。",
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

// フォルダ訪問履歴ピン留めトグル
export async function togglePinVisitedFolderAction(
  dirPath: string,
  currentPinned: boolean
) {
  // 認証
  const user = await resolveCurrentUserOrThrow();

  try {
    await togglePinVisitedFolder(user.id, dirPath, currentPinned);
  } catch (error) {
    console.error("Toggle Visited Folder Pinned Error:", error);
    return {
      success: false,
      error: "フォルダ更新中にエラーが発生しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

// サブフォルダ一覧
export async function listSubDirectoriesAction(dirPath: string) {
  // 認証
  await resolveCurrentUserOrThrow();

  // 入力バリデーション+正規化
  const normalizedDirPath = normalizeVirtualPath(dirPath);

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedDirPath)) {
    return { success: false, error: "システムフォルダは操作できません。" };
  }

  // 仮想パス→物理パス
  const realDirPath = getServerMediaPath(normalizedDirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realDirPath, { withFileTypes: true });
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return { success: false, error: "フォルダが見つかりません。" };
    }
    if (isFsPermissionError(e)) {
      return { success: false, error: "フォルダへのアクセス権がありません。" };
    }
    console.error("failed to read directory", e);
    return { success: false, error: "ファイル一覧の取得に失敗しました。" };
  }

  return {
    success: true,
    directories: entries
      .filter((e) => e.isDirectory())
      .filter((e) => !isSystemHiddenRealPath(join(realDirPath, e.name)))
      .map((e) => ({
        name: e.name,
        path: join(dirPath, e.name).replace(/\\/g, "/"),
      })),
  };
}
