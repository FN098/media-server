import { prisma } from "@/lib/prisma";
import { SearchTagsOptions, Tag } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";

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
  return prisma.tag.findMany({
    where: {
      id: excludeIds?.length ? { notIn: excludeIds } : undefined,
      name: query ? { contains: query } : undefined,
      mediaTags: { some: {} },
    },
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
  return prisma.tag.findMany({
    where: {
      id: excludeIds?.length ? { notIn: excludeIds } : undefined,
      name: query ? { contains: query } : undefined,
      mediaTags: { some: {} },
    },
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
  // 1. まず、名前が一致するタグをマスターから直接検索 (queryがある場合)
  let matchedTags: Tag[] = [];
  if (query) {
    matchedTags = await prisma.tag.findMany({
      where: {
        name: { contains: query },
        id: excludeIds?.length ? { notIn: excludeIds } : undefined,
      },
      take: limit,
    });
  }

  // 2. 最近使用された履歴を取得
  const rows = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    _max: { createdAt: true },
    orderBy: {
      _max: { createdAt: "desc" },
    },
    take: limit,
    where: {
      tagId: excludeIds?.length ? { notIn: excludeIds } : undefined,
      tag: query ? { name: { contains: query } } : undefined,
    },
  });

  // 3. 履歴にあるタグの詳細を取得
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

  // 4. マッチしたタグと履歴のタグを結合して重複排除
  // queryがある場合は matchedTags を優先し、その後に履歴を並べる
  const combined = [...matchedTags, ...sortedHistoryTags];

  // IDでユニークにする
  const uniqueTags = uniqueBy(combined, "id");

  return uniqueTags.slice(0, limit);
}
