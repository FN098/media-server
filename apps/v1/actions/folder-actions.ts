"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { fsNameSchema } from "@/lib/media/schemas";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { updateVisitedFolder } from "@/repositories/folder-repository";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";

// フォルダ訪問履歴更新
export async function visitFolderAction(dirPath: string): Promise<void> {
  const user = await resolveCurrentUserOrThrow();
  await updateVisitedFolder(dirPath, user.id);

  // キャッシュの更新
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

    // キャッシュの更新
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
