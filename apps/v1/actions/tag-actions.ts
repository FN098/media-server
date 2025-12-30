"use server";

import { prisma } from "@/lib/prisma"; // Prismaクライアントのパス

export async function updateMediaTagsAction(payload: {
  mediaIds: string[];
  changes: Record<string, "add" | "remove">;
}) {
  const { mediaIds, changes } = payload;

  if (mediaIds.length === 0) return { success: true };

  const tagIdsToAdd = Object.entries(changes)
    .filter(([_, op]) => op === "add")
    .map(([id]) => id);

  const tagIdsToRemove = Object.entries(changes)
    .filter(([_, op]) => op === "remove")
    .map(([id]) => id);

  try {
    // トランザクションで一括処理
    await prisma.$transaction(async (tx) => {
      // 1. 削除処理: 選択されたメディアIDのいずれかに紐付く、対象タグIDを一括削除
      if (tagIdsToRemove.length > 0) {
        await tx.mediaTag.deleteMany({
          where: {
            mediaId: { in: mediaIds },
            tagId: { in: tagIdsToRemove },
          },
        });
      }

      // 2. 追加処理: 既存のレコードと重複しないように追加
      // MySQL等で効率的な「無視して挿入」が難しいため、
      // 愚直に全組み合わせを作成し、createMany の skipDuplicates を使用
      if (tagIdsToAdd.length > 0) {
        const data = mediaIds.flatMap((mediaId) =>
          tagIdsToAdd.map((tagId) => ({
            mediaId,
            tagId,
          }))
        );

        await tx.mediaTag.createMany({
          data,
          skipDuplicates: true, // すでに存在する紐付けはスキップ
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update tags:", error);
    throw new Error("タグの更新に失敗しました");
  }
}
