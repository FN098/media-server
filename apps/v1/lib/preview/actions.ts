"use server";

import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { stat } from "fs/promises";
import { revalidatePath } from "next/cache";

// プレビュー更新
export async function updatePreviewAction(
  targetPath: string,
  previewResourcePath: string | null
) {
  const realPath = getServerMediaPath(targetPath);
  const s = await stat(realPath);
  const isDirectory = s.isDirectory();

  if (isDirectory) {
    // フォルダデータの更新
    try {
      await prisma.folderMeta.upsert({
        where: { path: targetPath },
        update: { previewPath: previewResourcePath },
        create: { path: targetPath, previewPath: previewResourcePath },
      });
    } catch (error) {
      console.error("Update Preview Error:", error);
      return { success: false, error: "プレビューの更新に失敗しました。" };
    }
  } else {
    // ファイルデータの更新
    try {
      await prisma.media.update({
        where: { path: targetPath },
        data: { previewPath: previewResourcePath },
      });
    } catch (error) {
      console.error("Update Preview Error:", error);
      return { success: false, error: "プレビューの更新に失敗しました。" };
    }
  }

  revalidatePath("/explorer");

  return { success: true };
}
