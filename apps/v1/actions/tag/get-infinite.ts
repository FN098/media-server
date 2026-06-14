"use server";

import { Prisma } from "@/generated/prisma/client";
import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { TagMasterItem } from "@/lib/tag/types";
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
export async function getTagsInfiniteAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { cursor, limit } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:get-infinite");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  const tagWhere = buildTagWhere({
    ...parsed.data,
    userId: user.id,
  });

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

    const tags = rawTags.map(({ userFavorites, _count, ...rest }) => {
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

const buildTagWhere = ({
  query,
  onlyFavorites,
  onlyNew,
  userId,
}: z.infer<typeof InputSchema> & {
  userId: string;
}) => {
  const where: Prisma.TagWhereInput = {
    isActive: true,
  };

  if (query) {
    where.OR = [{ kana: { contains: query } }, { name: { contains: query } }];
  }

  if (onlyFavorites) {
    where.userFavorites = {
      some: { userId: userId },
    };
  }

  if (onlyNew) {
    where.isNew = true;
  }

  return where;
};
