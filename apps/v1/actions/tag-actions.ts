"use server";

import { prisma } from "@/lib/prisma"; // Prismaクライアントのパス
import { TagOperation } from "@/lib/tag/types";

export async function updateMediaTagsAction(payload: {
  mediaPaths: string[];
  operations: TagOperation[];
}) {
  const { mediaPaths, operations } = payload;

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

export async function createTagAction(name: string) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) return { success: false, error: "タグ名が空です" };

    // 同じ名前のタグが既にあるか確認、なければ作成
    const tag = await prisma.tag.upsert({
      where: { name: trimmedName },
      update: {}, // 存在すれば何もしない
      create: { name: trimmedName },
    });
    return { success: true, tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return { success: false, error: "タグの作成に失敗しました" };
  }
}
