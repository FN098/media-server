"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

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
