import { prisma } from "@/lib/prisma";

export async function removeTag(tagId: string) {
  return await prisma.tag.delete({
    where: {
      id: tagId,
    },
  });
}

export async function searchTags(query: string, limit = 10) {
  return await prisma.tag.findMany({
    where: {
      name: { contains: query },
    },
    orderBy: {
      mediaTags: {
        _count: "desc", // 多く紐づけされたタグを優先
      },
    },
    take: limit,
  });
}

export async function addTagsToMedia(mediaId: string, tagNames: string[]) {
  return await prisma.media.update({
    where: { id: mediaId },
    data: {
      mediaTags: {
        create: tagNames.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
  });
}

export async function removeTagFromMedia(mediaId: string, tagId: string) {
  return await prisma.mediaTag.delete({
    where: {
      mediaId_tagId: {
        mediaId: mediaId,
        tagId: tagId,
      },
    },
  });
}

export async function getRelatedTags(
  paths: string[],
  options?: { limit?: number }
) {
  if (paths.length > 0) {
    return await prisma.tag.findMany({
      where: {
        mediaTags: {
          some: { media: { path: { in: paths } } },
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: options?.limit,
    });
  }

  return [];
}

export async function getPopularTags(options?: {
  excludeIds?: string[];
  limit?: number;
}) {
  const excludeIds = options?.excludeIds;
  const limit = options?.limit;

  return await prisma.tag.findMany({
    where: {
      id: excludeIds ? { notIn: excludeIds } : undefined,
      mediaTags: { some: {} }, // 最低1つは紐付いているもの
    },
    orderBy: {
      mediaTags: { _count: "desc" },
    },
    take: limit,
  });
}
