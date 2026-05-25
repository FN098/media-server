"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { CreateTagsResult, TagOperation } from "@/lib/tag/types";
import { generateKana } from "@/lib/utils/kana";
import { basename } from "path";

// タグ紐づけ・クリーンアップ
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

// タグ一括作成
export async function createTagsAction(
  names: string[]
): Promise<CreateTagsResult> {
  try {
    const normalizedNames = Array.from(
      new Set(names.map(normalizeTagName).filter((n): n is string => !!n))
    );

    if (normalizedNames.length === 0) {
      return { success: true, tags: [] };
    }

    const existingTags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    const existingNames = new Set(existingTags.map((t) => t.name));

    // 未存在のタグのみ、カナを含めてデータ作成
    const toCreate = await Promise.all(
      normalizedNames
        .filter((name) => !existingNames.has(name))
        .map(async (name) => ({
          name,
          kana: await generateKana(name),
          isActive: true,
        }))
    );

    if (toCreate.length > 0) {
      await prisma.tag.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    const tags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    return { success: true, tags };
  } catch (error) {
    console.error("Create tags error:", error);
    return { success: false, error: "タグの作成に失敗しました" };
  }
}

// 不要タグスキャン
export async function scanUnusedTagsAction() {
  try {
    // どの MediaTag にも紐付いていないタグを取得
    const unusedTags = await prisma.tag.findMany({
      where: {
        mediaTags: {
          none: {}, // リレーションが空のもの
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { mediaTags: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      tags: unusedTags.map((t) => ({
        id: t.id,
        name: t.name,
        usageCount: t._count.mediaTags,
      })),
    };
  } catch (error) {
    console.error("Scan Unused Tags Error:", error);
    return { success: false, error: "タグのスキャンに失敗しました。" };
  }
}

// 不要タグ削除
export async function deleteSelectedTagsAction(ids: string[]) {
  try {
    if (ids.length === 0) return { success: true, deletedCount: 0 };

    const deleteResult = await prisma.tag.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    console.error("Delete Tags Error:", error);
    return { success: false, error: "タグの削除中にエラーが発生しました。" };
  }
}

// タグ一覧無限スクロール
export async function getTagsInfiniteAction({
  cursor,
  query,
  limit = 50,
  onlyFavorites = false,
  onlyNew = false,
}: {
  cursor?: string;
  query?: string;
  limit?: number;
  onlyFavorites?: boolean;
  onlyNew?: boolean;
}) {
  try {
    const { id: userId } = await resolveCurrentUserOrThrow();

    const buildTagWhere = (): Prisma.TagWhereInput => {
      const where: Prisma.TagWhereInput = {
        isActive: true,
      };

      if (query) {
        where.OR = [
          { kana: { contains: query } },
          { name: { contains: query } },
        ];
      }

      if (onlyFavorites) {
        where.userFavorites = {
          some: { userId },
        };
      }

      if (onlyNew) {
        where.isNew = true;
      }

      return where;
    };

    const tagWhere = buildTagWhere();

    const rawTags = await prisma.tag.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: tagWhere,
      // 読み(kana)順、次に名前(name)順でソート
      orderBy: [{ kana: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        kana: true,
        isNew: true,
        _count: { select: { mediaTags: true } },
        userFavorites: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    // フロントエンドが扱いやすいように整形
    const tags = rawTags.map((tag) => {
      const { userFavorites, ...rest } = tag;
      return {
        ...rest,
        isFavorite: userFavorites.length > 0,
      };
    });

    const nextCursor =
      tags.length === limit ? tags[tags.length - 1].id : undefined;

    return { success: true, tags, nextCursor };
  } catch (error) {
    console.error("Get Tags Error:", error);
    return { success: false, error: "タグの取得に失敗しました。" };
  }
}

// タグ既読チェック
export async function markTagsAsReadAction(ids: string[]) {
  try {
    if (ids.length === 0) return { success: true };

    await prisma.tag.updateMany({
      where: {
        id: { in: ids },
        isNew: true, // 念のため新規のものだけに限定
        isActive: true,
      },
      data: {
        isNew: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Mark Tags As Read Error:", error);
    return { success: false, error: "タグの更新に失敗しました。" };
  }
}

// タグお気に入り更新
export async function updateTagFavoriteAction(id: string, isFavorite: boolean) {
  try {
    const { id: userId } = await resolveCurrentUserOrThrow();

    if (isFavorite) {
      // お気に入り登録：UserTagFavorite レコードを作成
      // すでに存在する場合にエラーにならないよう upsert か create (ignore) 的な処理にする
      await prisma.userTagFavorite.upsert({
        where: {
          userId_tagId: {
            userId,
            tagId: id,
          },
        },
        update: {}, // すでに存在する場合は何もしない
        create: {
          userId,
          tagId: id,
        },
      });
    } else {
      // お気に入り解除：UserTagFavorite レコードを削除
      // 存在しないレコードを delete するとエラーになるため deleteMany を使用
      await prisma.userTagFavorite.deleteMany({
        where: {
          userId,
          tagId: id,
        },
      });
    }

    // フロントエンドとの互換性のために、現在の状態を返す
    return { success: true, isFavorite };
  } catch (error) {
    console.error("Update Tag Favorite Error:", error);
    return { success: false, error: "タグのお気に入り更新に失敗しました。" };
  }
}

// タグリネーム
export async function renameTagAction(
  id: string,
  newName: string,
  newKana?: string
) {
  try {
    const normalizedName = normalizeTagName(newName);
    if (!normalizedName) throw new Error("Invalid name");

    const kana = newKana || (await generateKana(normalizedName));

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: normalizedName,
        kana, // 名前が変わったら読みも更新
      },
    });
    return { success: true, tag };
  } catch (error) {
    console.error("Rename Tag Error:", error);
    return { success: false, error: "タグの名前変更に失敗しました。" };
  }
}

// タグ削除
export async function deleteTagAction(id: string) {
  try {
    const tag = await prisma.tag.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      tag,
      message: `タグ「${tag.name}」を削除しました。`,
    };
  } catch (error) {
    console.error("Delete Tag Error:", error);
    return {
      success: false,
      error: "タグの削除に失敗しました。既に削除されている可能性があります。",
    };
  }
}

export async function getMediaByTagId(tagId: string, limit = 20) {
  try {
    const media = await prisma.media.findMany({
      where: {
        mediaTags: {
          some: {
            tagId: tagId,
          },
        },
      },
      // dirPath が同じものは 1 つのレコードのみを返す（DBレベルでのグループ化）
      distinct: ["dirPath"],
      select: {
        id: true,
        title: true,
        path: true,
        dirPath: true,
      },
      orderBy: {
        dirPath: "asc",
      },
      take: limit,
    });

    const result = media.map((m) => {
      const displayTitle = basename(m.dirPath);

      return {
        id: m.id,
        title: displayTitle,
        path: m.path,
        url: `${getClientExplorerPath(m.dirPath)}?tagIds=${tagId}`,
      };
    });

    return {
      success: true,
      media: result,
    };
  } catch (error) {
    console.error("Failed to fetch media by tag:", error);
    return {
      success: false,
      error: "メディア情報の取得に失敗しました。",
    };
  }
}
