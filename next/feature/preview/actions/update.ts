"use server";

import { authorize } from "@/lib/authorization/authorize";
import { getFilePath } from "@/lib/file/repository";
import { getFolderPath } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { getPathInfo } from "@/lib/utils/fs";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; message: string };

// プレビュー更新
export async function updatePreviewFileAction({
  id,
  isDirectory,
  previewFileId,
}: {
  id: string;
  isDirectory: boolean;
  previewFileId: string | null;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("file:update-preview", "folder:update-preview");
  if (!auth.success) {
    return auth;
  }

  try {
    const targetPath = isDirectory
      ? await getFolderPath(id)
      : await getFilePath(id);

    // 仮想パス→物理パス
    const realTargetPath = getServerMediaPath(targetPath);

    // ディレクトリ判定
    const targetPathInfo = await getPathInfo(realTargetPath);
    if (!targetPathInfo.exists) {
      if (targetPathInfo.error === "not-found") {
        return {
          success: false,
          message: "対象のファイルまたはフォルダが存在しません。",
        };
      } else {
        return {
          success: false,
          message: "対象のファイルまたはフォルダにアクセスできません。",
        };
      }
    }

    if (targetPathInfo.isDirectory) {
      // フォルダデータの更新
      await prisma.folder.update({
        where: { id },
        data: { previewFileId },
      });
    } else {
      // ファイルデータの更新
      await prisma.file.update({
        where: { id },
        data: { previewFileId },
      });
    }

    // キャッシュ更新
    revalidatePath("/explorer");

    return { success: true };
  } catch (error) {
    logger.error("action:update-preview", error);
    return { success: false, message: "プレビューの更新に失敗しました。" };
  }
}
