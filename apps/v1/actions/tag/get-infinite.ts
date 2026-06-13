"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { prisma } from "@/lib/prisma";
import { TagMasterItem } from "@/lib/tag/types";
import { logger } from "better-auth";
import z from "zod";

const InputSchema = z.object({
  cursor: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  onlyFavorites: z.boolean().optional().default(false),
  onlyNew: z.boolean().optional().default(false),
});

type ActionResult =
  | { success: true; tags: TagMasterItem[]; nextCursor?: string }
  | { success: false; message: string };

// タグ一覧無限スクロール
export async function getTagsInfiniteAction(input: {
  cursor?: string;
  query?: string;
  limit?: number;
  onlyFavorites?: boolean;
  onlyNew?: boolean;
}): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }
  const { cursor, query, limit, onlyFavorites, onlyNew } = parsed.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "tag:get-infinite")) {
    return { success: false, message: "権限がありません。" };
  }

  const buildTagWhere = (): Prisma.TagWhereInput => {
    const where: Prisma.TagWhereInput = {
      isActive: true,
    };

    if (query) {
      where.OR = [{ kana: { contains: query } }, { name: { contains: query } }];
    }

    if (onlyFavorites) {
      where.userFavorites = {
        some: { userId: user.id },
      };
    }

    if (onlyNew) {
      where.isNew = true;
    }

    return where;
  };
  const tagWhere = buildTagWhere();

  try {
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
          where: { userId: user.id },
          select: { userId: true },
        },
      },
    });

    const tags = rawTags.map((tag) => {
      const { userFavorites, _count, ...rest } = tag;
      return {
        ...rest,
        isFavorite: userFavorites.length > 0,
        relatedMediaCount: _count.mediaTags,
      } satisfies TagMasterItem;
    });

    const nextCursor =
      tags.length === limit ? tags[tags.length - 1].id : undefined;

    return { success: true, tags, nextCursor };
  } catch (error) {
    logger.error("action:get-tags-infinite", error);
    return { success: false, message: "タグの取得に失敗しました。" };
  }
}
