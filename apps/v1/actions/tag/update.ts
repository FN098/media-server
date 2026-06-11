"use server";

import { prisma } from "@/lib/prisma";
import { TagOperation } from "@/lib/tag/types";

// TODO: バリデーション・認証追加
// タグ紐づけ・クリーンアップ
export async function updateMediaTagsAction({
  mediaPaths,
  operations,
}: {
  mediaPaths: string[];
  operations: TagOperation[];
}) {
  if (mediaPaths.length === 0 || operations.length === 0) {
    return { success: true };
  }

  const tagIdsToAdd = operations
    .filter((op) => op.operator === "add")
    .map((op) => op.tagId);

  const tagIdsToRemove = operations
    .filter((op) => op.operator === "remove")
    .map((op) => op.tagId);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. mediaPaths から mediaId のリストを取得
      const mediaList = await tx.media.findMany({
        where: { path: { in: mediaPaths } },
        select: { id: true },
      });
      const mediaIds = mediaList.map((m) => m.id);

      if (mediaIds.length === 0) return;

      // 2. 紐付けの解除
      if (tagIdsToRemove.length > 0) {
        await tx.mediaTag.deleteMany({
          where: {
            mediaId: { in: mediaIds },
            tagId: { in: tagIdsToRemove },
          },
        });
      }

      // 3. 紐付けの追加
      if (tagIdsToAdd.length > 0) {
        // 全組み合わせを作成
        const data = mediaIds.flatMap((mediaId) =>
          tagIdsToAdd.map((tagId) => ({
            mediaId,
            tagId,
          }))
        );

        await tx.mediaTag.createMany({
          data,
          skipDuplicates: true, // 既に存在するペアは無視
        });
      }

      // 4. 孤立したタグの削除 (クリーンアップ)
      if (tagIdsToRemove.length > 0) {
        await tx.tag.deleteMany({
          where: {
            id: { in: tagIdsToRemove },
            mediaTags: {
              none: {}, // どの MediaTag からも参照されていない
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update tags:", error);
    return { success: false, error: "タグの更新に失敗しました" };
  }
}
