"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import {
  getRecentFolders,
  togglePinVisitedFolder,
  updateVisitedFolder,
} from "@/lib/folder/repository";
import { FsNameSchema } from "@/lib/media/schemas";
import { isBlockedServerPath } from "@/lib/path/blacklist";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { Dirent } from "fs";
import { mkdir, readdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename } from "path";
import { join } from "path/posix";

// フォルダ訪問履歴更新
export async function visitFolderAction(dirPath: string): Promise<void> {
  const user = await resolveCurrentUserOrThrow();

  await updateVisitedFolder(dirPath, user.id);

  revalidatePath("/dashboard");
}

// フォルダ作成
export async function createFolderAction(
  parentPath: string,
  folderName: string
) {
  const validation = FsNameSchema.safeParse(folderName);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  try {
    const trimmedName = folderName.trim();

    // 仮想パスの生成 (例: /parent/path -> /parent/path/newfolder)
    const newVirtualPath =
      parentPath === "/"
        ? `/${trimmedName}`
        : `${parentPath.replace(/\/$/, "")}/${trimmedName}`;

    const newRealPath = getServerMediaPath(newVirtualPath);

    if (await existsPath(newRealPath)) {
      return {
        success: false,
        error: "同名のフォルダまたはファイルが既に存在します。",
      };
    }

    await mkdir(newRealPath, { recursive: true });

    revalidatePath("/explorer");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create Folder Error:", error);
    return {
      success: false,
      error: "フォルダ作成中にエラーが発生しました。",
    };
  }
}

// 最近訪問したフォルダを取得
export async function listRecentFoldersAction() {
  try {
    const user = await resolveCurrentUserOrThrow();
    const folders = await getRecentFolders(user.id, 10);

    return {
      success: true,
      data: folders.map((f) => ({
        path: f.dirPath,
        name: basename(f.dirPath),
        pinned: f.isPinned,
      })),
    };
  } catch (error) {
    console.error("Get Recent Folders Error:", error);
    return {
      success: false,
      error: "フォルダ取得中にエラーが発生しました。",
    };
  }
}

// フォルダ訪問履歴ピン留めトグル
export async function togglePinVisitedFolderAction(
  dirPath: string,
  currentPinned: boolean
) {
  try {
    const user = await resolveCurrentUserOrThrow();
    await togglePinVisitedFolder(user.id, dirPath, currentPinned);

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Toggle Visited Folder Pinned Error:", error);
    return {
      success: false,
      error: "フォルダ更新中にエラーが発生しました。",
    };
  }
}

// サブフォルダ一覧
export async function listSubDirectoriesAction(dirPath: string) {
  if (!dirPath) {
    return { success: false, error: "パスが指定されていません" };
  }

  const realPath = getServerMediaPath(dirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realPath, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, error: "フォルダが見つかりません" };
    }
    if ((e as NodeJS.ErrnoException).code === "EACCES") {
      return { success: false, error: "フォルダへのアクセス権がありません" };
    }
    console.error(`Sub Directories Error [${dirPath}]:`, e);
    return { success: false, error: "フォルダ一覧の取得に失敗しました" };
  }

  return {
    success: true,
    directories: entries
      .filter((e) => e.isDirectory())
      .filter((e) => !isBlockedServerPath(join(realPath, e.name)))
      .map((e) => ({
        name: e.name,
        path: join(dirPath, e.name).replace(/\\/g, "/"),
      })),
  };
}
