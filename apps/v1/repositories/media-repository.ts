import type { Media } from "@/generated/prisma/client";
import { detectMediaType } from "@/lib/media/media-types";
import { DbMedia, MediaNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";
import path from "path";

export async function findMediaByPath(path: string): Promise<Media | null> {
  return prisma.media.findUnique({
    where: {
      path,
    },
  });
}

export async function findMediaByPathOrThrow(
  path: string
): Promise<Media | null> {
  return prisma.media.findUniqueOrThrow({
    where: {
      path,
    },
  });
}

export async function getDbMediaCount(dirPath: string): Promise<number> {
  return await prisma.media.count({
    where: { dirPath },
  });
}

export async function getDbMedia(
  dirPath: string,
  userId: string
): Promise<DbMedia[]> {
  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: {
      id: true,
      path: true,
      title: true,
      fileMtime: true,
      fileSize: true,
      favorites: {
        where: { userId },
        select: { mediaId: true },
      },
    },
  });

  return dbMedia.map((m) => ({
    id: m.id,
    fileMtime: m.fileMtime,
    isFavorite: m.favorites.length > 0,
    path: m.path,
    fileSize: Number(m.fileSize),
    title: m.title ?? undefined,
  }));
}

export async function getFavoriteMediaNodes(
  userId: string
): Promise<MediaNode[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: {
      media: {
        select: {
          id: true,
          path: true,
          title: true,
          fileMtime: true,
          fileSize: true,
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
    title: f.media.title ?? undefined,
    isFavorite: true,
  }));
}

export async function getMediaByTags(tagNames: string[]) {
  return await prisma.media.findMany({
    where: {
      mediaTags: {
        every: {
          tag: {
            name: { in: tagNames },
          },
        },
      },
    },
  });
}
