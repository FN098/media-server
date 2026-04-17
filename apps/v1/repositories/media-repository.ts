import { MediaDbNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

export async function getVirtualMediaNodes(
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
        select: { mediaId: true, rating: true },
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
    fileMtime: m.fileMtime,
    path: m.path,
    previewPath: m.previewPath ?? null,
    fileSize: Number(m.fileSize),
    title: m.title ?? null,
    tags: m.mediaTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
    rating: m.favorites[0]?.rating ?? null,
  }));
}
