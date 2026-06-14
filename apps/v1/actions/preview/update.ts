"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { getPathInfo } from "@/lib/utils/fs";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  targetPath: EditableVirtualPathSchema,
  previewResourcePath: EditableVirtualPathSchema.nullable(), // null ならプレビュー解除
});

type UpdatePreviewActionResult =
  | { success: true }
  | { success: false; message: string };

// プレビュー更新
export async function updatePreviewAction(
  input: z.input<typeof InputSchema>
): Promise<UpdatePreviewActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { targetPath, previewResourcePath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:update-preview", "folder:update-preview");
  if (!auth.success) {
    return auth;
  }

  try {
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
      await prisma.folderMeta.upsert({
        where: { path: targetPath },
        update: { previewPath: previewResourcePath },
        create: {
          path: targetPath,
          previewPath: previewResourcePath,
        },
      });
    } else {
      // ファイルデータの更新
      await prisma.media.update({
        where: { path: targetPath },
        data: { previewPath: previewResourcePath },
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
