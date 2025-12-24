import { prisma } from "@/lib/prisma";

export async function createFavorite(
  userId: string,
  mediaId: string
): Promise<void> {
  await prisma.favorite.upsert({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
    create: {
      userId,
      mediaId,
    },
    update: {}, // すでにある場合は何もしない
  });
}

export async function deleteFavorite(
  userId: string,
  mediaId: string
): Promise<void> {
  await prisma.favorite.delete({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
  });
}

export async function isFavorite(
  userId: string,
  mediaId: string
): Promise<boolean> {
  const count = await prisma.favorite.count({
    where: {
      userId,
      mediaId,
    },
  });
  return count > 0;
}
