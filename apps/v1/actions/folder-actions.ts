"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import {
  getRecentFolders,
  togglePinVisitedFolder,
  updateVisitedFolder,
} from "@/lib/folder/repository";
import { fsNameSchema } from "@/lib/media/schemas";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename } from "path";

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
  const validation = fsNameSchema.safeParse(folderName);

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

// 最近訪問したフォルダを取得（移動用）
export async function getRecentFoldersAction() {
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
