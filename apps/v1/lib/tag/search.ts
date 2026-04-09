import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchTagsOptions, Tag } from "@/lib/tag/types";

export async function searchTags(options: SearchTagsOptions): Promise<Tag[]> {
  const strategy = options?.strategy ?? "most-related";

  switch (strategy) {
    case "most-related":
      return searchMostRelatedTags(options);

    case "recently-created":
      return searchRecentlyCreatedTags(options);

    case "recently-used":
      return searchRecentlyUsedTags(options);

    default:
      return searchRecentlyUsedTags(options);
  }
}

// 最も参照件数が多いタグ
async function searchMostRelatedTags({
  excludeIds,
  limit,
  query,
}: SearchTagsOptions): Promise<Tag[]> {
  const buildTagWhere = (): Prisma.TagWhereInput => {
    const where: Prisma.TagWhereInput = {
      isActive: true,
    };

    if (query) {
      where.OR = [{ kana: { contains: query } }, { name: { contains: query } }];
    }

    if (excludeIds && excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    return where;
  };

  const tagWhere = buildTagWhere();

  return prisma.tag.findMany({
    where: tagWhere,
    orderBy: {
      mediaTags: { _count: "desc" },
    },
    take: limit,
    select: { id: true, name: true },
  });
}

// 最も新しく作られたタグ
async function searchRecentlyCreatedTags({
  excludeIds,
  limit,
  query,
}: SearchTagsOptions): Promise<Tag[]> {
  const buildTagWhere = (): Prisma.TagWhereInput => {
    const where: Prisma.TagWhereInput = {
      isActive: true,
    };

    if (query) {
      where.OR = [{ kana: { contains: query } }, { name: { contains: query } }];
    }

    if (excludeIds && excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    return where;
  };

  const tagWhere = buildTagWhere();

  return prisma.tag.findMany({
    where: tagWhere,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true },
  });
}

// 最も最近使われたタグ
async function searchRecentlyUsedTags({
  excludeIds,
  limit,
  query,
}: SearchTagsOptions): Promise<Tag[]> {
  const buildTagWhere = (): Prisma.TagWhereInput => {
    const where: Prisma.TagWhereInput = {
      isActive: true,
    };

    if (query) {
      where.OR = [{ kana: { contains: query } }, { name: { contains: query } }];
    }

    if (excludeIds && excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    return where;
  };

  const tagWhere = buildTagWhere();

  // 最近使用された履歴を取得
  const rows = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    _max: { createdAt: true },
    orderBy: {
      _max: { createdAt: "desc" },
    },
    take: limit,
    where: {
      tag: tagWhere,
    },
  });

  // 履歴にあるタグの詳細を取得
  const historyTags = await prisma.tag.findMany({
    select: { id: true, name: true },
    where: {
      id: { in: rows.map((r) => r.tagId) },
    },
  });

  // 重要：historyTagDetailsをIDをキーにしたMapに変換し、rowsの順番通りに配列を再構成する
  const tagMap = new Map(historyTags.map((t) => [t.id, t]));
  const sortedHistoryTags = rows
    .map((r) => tagMap.get(r.tagId))
    .filter((t): t is Tag => !!t);

  return sortedHistoryTags.slice(0, limit);
}
