"use server";

import { authorize } from "@/lib/authorization/authorize";
import { getFolderPath } from "@/lib/folder/repository";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { existsPath } from "@/lib/utils/fs";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";

type ActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
    };

// フォルダ作成
export async function createFolderAction({
  parentFolderId,
  newFolderName,
}: {
  parentFolderId: string;
  newFolderName: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("folder:create");
  if (!auth.success) {
    return auth;
  }

  let parentFolderPath: string;
  try {
    parentFolderPath = await getFolderPath(parentFolderId);
  } catch (error) {
    logger.error("create-folder-action:get-parent-folder-path", error);
    return {
      success: false,
      message: "フォルダが見つかりません。",
    };
  }

  // 仮想パス→物理パス
  const newVirtualPath = join(parentFolderPath, newFolderName);
  const newRealPath = resolveMediaPath(newVirtualPath);

  if (await existsPath(newRealPath)) {
    return {
      success: false,
      message: "同名のフォルダまたはファイルが既に存在します。",
    };
  }

  try {
    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    logger.error("create-folder-action:make-directories", error);
    return {
      success: false,
      message: "フォルダの作成に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/explorer");

  return { success: true };
}
