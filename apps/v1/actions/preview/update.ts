"use server";

import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { getPathInfo } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { revalidatePath } from "next/cache";

type UpdatePreviewActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// プレビュー更新
export async function updatePreviewAction(
  targetPath: string,
  previewResourcePath: string | null
): Promise<UpdatePreviewActionResult> {
  // 入力バリデーション＋正規化
  if (!targetPath || (previewResourcePath !== null && !previewResourcePath)) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    targetPath: VirtualPathSchema.safeParse(sanitize(targetPath)),
    previewResourcePath:
      previewResourcePath === null
        ? {
            success: true,
            data: null,
            error: null,
          }
        : VirtualPathSchema.safeParse(sanitize(previewResourcePath)),
  };
  if (!parsed.targetPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "targetPath", issues: parsed.targetPath.error?.issues }],
    };
  }
  if (!parsed.previewResourcePath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        {
          prop: "previewResourcePath",
          issues: parsed.previewResourcePath.error?.issues,
        },
      ],
    };
  }
  const normalizedTargetPath = parsed.targetPath.data;
  const normalizedPreviewPath = parsed.previewResourcePath.data;

  // 仮想パス→物理パス
  const realTargetPath = getServerMediaPath(normalizedTargetPath);

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
    try {
      await prisma.folderMeta.upsert({
        where: { path: normalizedTargetPath },
        update: { previewPath: normalizedPreviewPath },
        create: {
          path: normalizedTargetPath,
          previewPath: normalizedPreviewPath,
        },
      });
    } catch (error) {
      logger.error("action:update-preview", error);
      return { success: false, message: "プレビューの更新に失敗しました。" };
    }
  } else {
    // ファイルデータの更新
    try {
      await prisma.media.update({
        where: { path: normalizedTargetPath },
        data: { previewPath: normalizedPreviewPath },
      });
    } catch (error) {
      logger.error("action:update-preview", error);
      return { success: false, message: "プレビューの更新に失敗しました。" };
    }
  }

  revalidatePath("/explorer");

  return { success: true };
}
