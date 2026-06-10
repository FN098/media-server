import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchTagStrategy } from "@/lib/tag/strategies";
import { Tag } from "@/lib/tag/types";

type SearchTagsOptions = {
  excludeIds?: string[];
  limit?: number;
  query?: string;
  strategy?: SearchTagStrategy;
};

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
  limit = 100,
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
  limit = 100,
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
  limit = 100,
  query,
}: SearchTagsOptions): Promise<Tag[]> {
  const baseWhere: Prisma.TagWhereInput = {
    isActive: true,
    ...(query && {
      OR: [{ kana: { contains: query } }, { name: { contains: query } }],
    }),
    ...(excludeIds?.length && { id: { notIn: excludeIds } }),
  };

  // 1. 履歴あり: 最近使用順
  const rows = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: limit,
    where: { tag: baseWhere },
  });

  const historyTagIds = rows.map((r) => r.tagId);

  const historyTagDetails = await prisma.tag.findMany({
    select: { id: true, name: true },
    where: { id: { in: historyTagIds } },
  });

  const tagMap = new Map(historyTagDetails.map((t) => [t.id, t]));
  const historyTags = rows
    .map((r) => tagMap.get(r.tagId))
    .filter((t): t is Tag => !!t);

  // limitに達していれば履歴だけで返す
  if (historyTags.length >= limit) {
    return historyTags.slice(0, limit);
  }

  // 2. 履歴なし: tag.updatedAt 降順で補完
  const remainingLimit = limit - historyTags.length;

  const noHistoryTags = await prisma.tag.findMany({
    select: { id: true, name: true },
    where: {
      ...baseWhere,
      id: { notIn: [...(excludeIds ?? []), ...historyTagIds] },
    },
    orderBy: { updatedAt: "desc" },
    take: remainingLimit,
  });

  return [...historyTags, ...noHistoryTags];
}
