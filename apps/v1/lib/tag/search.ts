import { prisma } from "@/lib/prisma";
import { SearchTagsOptions, Tag } from "@/lib/tag/types";

export async function searchTags(options: SearchTagsOptions): Promise<Tag[]> {
  const strategy = options?.strategy ?? "most-related";

  if (strategy === "recently-used") {
    return searchRecentlyUsedTags(options);
  }

  if (strategy === "recently-created") {
    return searchRecentlyCreatedTags(options);
  }

  // default
  return searchMostRelatedTags(options);
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
  const rows = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    _max: { createdAt: true },
    orderBy: {
      _max: { createdAt: "desc" },
    },
    take: limit,
    where: {
      tagId: excludeIds?.length ? { notIn: excludeIds } : undefined,
      tag: query
        ? {
            name: { contains: query },
          }
        : undefined,
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      id: { in: rows.map((r) => r.tagId) },
    },
    select: { id: true, name: true },
  });

  return rows.map((r) => tags.find((t) => t.id === r.tagId)!);
}
