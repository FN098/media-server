"use server";

import { prisma } from "@/lib/prisma"; // Prismaクライアントのパス
import { normalizeTagName } from "@/lib/tag/normalize";
import { CreateTagsResult, TagOperation } from "@/lib/tag/types";
import { revalidateTag } from "next/cache";

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

    revalidateTag("tags", "max");

    return { success: true };
  } catch (error) {
    console.error("Failed to update tags:", error);
    return { success: false, error: "タグの更新に失敗しました" };
  }
}

export async function createTagAction(name: string) {
  try {
    const normalizedName = normalizeTagName(name);
    if (!normalizedName) {
      return { success: false, error: "タグ名が空です" };
    }

    // 同じ名前のタグが既にあるか確認、なければ作成
    const tag = await prisma.tag.upsert({
      where: { name: normalizedName },
      update: {}, // 存在すれば何もしない
      create: { name: normalizedName },
    });

    revalidateTag("tags", "max");

    return { success: true, tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return { success: false, error: "タグの作成に失敗しました" };
  }
}

export async function createTagsAction(
  names: string[]
): Promise<CreateTagsResult> {
  try {
    // 正規化 & 空除外 & 重複排除
    const normalizedNames = Array.from(
      new Set(names.map(normalizeTagName).filter((n): n is string => !!n))
    );

    if (normalizedNames.length === 0) {
      return { success: true, tags: [] };
    }

    // 既存タグ取得
    const existingTags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    const existingNames = new Set(existingTags.map((t) => t.name));

    // 未存在のみ作成
    const toCreate = normalizedNames
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ name }));

    if (toCreate.length > 0) {
      await prisma.tag.createMany({
        data: toCreate,
        skipDuplicates: true, // 念のため
      });
    }

    // 改めて全タグ取得
    const tags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    revalidateTag("tags", "max");

    return { success: true, tags };
  } catch (error) {
    console.error("Create tags error:", error);
    return { success: false, error: "タグの作成に失敗しました" };
  }
}
