"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { logger } from "@/__lib/logger";
import { prisma } from "@/__lib/prisma";

type ActionResult = { success: true } | { success: false; message: string };

// タグ紐づけ・クリーンアップ
export async function updateManyMediaTagsAction({
  fileIds,
  operations,
}: {
  fileIds: string[];
  operations: {
    tagId: string;
    operator: "add" | "remove";
  }[];
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize(
    "media-tag:create-many",
    "media-tag:delete-many",
    "tag:delete-unused"
  );
  if (!auth.success) {
    return auth;
  }

  const tagIdsToAdd = operations
    .filter((op) => op.operator === "add")
    .map((op) => op.tagId);

  const tagIdsToRemove = operations
    .filter((op) => op.operator === "remove")
    .map((op) => op.tagId);

  try {
    await prisma.$transaction(async (tx) => {
      // 紐付けの解除
      if (tagIdsToRemove.length > 0) {
        await tx.fileTag.deleteMany({
          where: {
            fileId: { in: fileIds },
            tagId: { in: tagIdsToRemove },
          },
        });
      }

      // 紐付けの追加
      if (tagIdsToAdd.length > 0) {
        const data = fileIds.flatMap((fileId) =>
          tagIdsToAdd.map((tagId) => ({
            fileId,
            tagId,
          }))
        );

        await tx.fileTag.createMany({
          data,
          skipDuplicates: true, // 既に存在するペアは無視
        });
      }

      // 孤立したタグの削除 (クリーンアップ)
      if (tagIdsToRemove.length > 0) {
        await tx.tag.deleteMany({
          where: {
            id: { in: tagIdsToRemove },
            fileTags: {
              none: {},
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    logger.error("action:update-many-media-tags", error);
    return { success: false, message: "タグの更新に失敗しました" };
  }
}
