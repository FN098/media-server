import { detectMediaType } from "@/lib/media/media-types";
import { MediaDbNode, MediaNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";
import path from "path";

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

export async function getFavoriteMediaNodes(
  userId: string
): Promise<MediaNode[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: {
      rating: true,
      createdAt: true,
      media: {
        select: {
          id: true,
          path: true,
          title: true,
          fileMtime: true,
          fileSize: true,
          previewPath: true,
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
      },
    },
    orderBy: {
      media: { path: "asc" },
    },
  });

  return favorites.map((f) => ({
    id: f.media.id,
    name: path.basename(f.media.path),
    path: f.media.path,
    type: detectMediaType(f.media.path),
    isDirectory: false,
    size: Number(f.media.fileSize),
    mtime: f.media.fileMtime,
    title: f.media.title ?? null,
    tags: f.media.mediaTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
    rating: f.rating ?? null,
    favoritedAt: f.createdAt,
    previewPath: f.media.previewPath,
  }));
}
