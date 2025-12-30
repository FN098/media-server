import { prisma } from "@/lib/prisma";

export async function removeTag(tagId: string) {
  return await prisma.tag.delete({
    where: {
      id: tagId,
    },
  });
}

export async function searchTags(query: string) {
  return await prisma.tag.findMany({
    where: {
      name: { contains: query },
    },
    orderBy: {
      mediaTags: {
        _count: "desc", // 多く紐づけされたタグを優先
      },
    },
    take: 10, // パフォーマンスのため制限
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
