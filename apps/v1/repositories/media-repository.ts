import { MediaDbNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

export async function getMediaDbNodes(
  dirPath: string,
  userId: string
): Promise<MediaDbNode[]> {
  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: {
      id: true,
      path: true,
      previewPath: true,
      title: true,
      fileMtime: true,
      fileSize: true,
      favorites: {
        where: { userId },
        select: { rating: true, createdAt: true },
      },
      mediaTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return dbMedia.map((m) => ({
    id: m.id,
    path: m.path,
    previewPath: m.previewPath ?? null,
    title: m.title ?? null,
    fileMtime: m.fileMtime,
    fileSize: Number(m.fileSize),
    rating: m.favorites[0]?.rating ?? null,
    favoritedAt: m.favorites[0]?.createdAt,
    tags: m.mediaTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
  }));
}
