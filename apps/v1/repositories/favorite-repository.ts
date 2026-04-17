import { prisma } from "@/lib/prisma";

export async function upsertFavorite(
  userId: string,
  mediaId: string,
  rating: number | null
) {
  return await prisma.favorite.upsert({
    where: {
      userId_mediaId: { userId, mediaId },
    },
    update: { rating },
    create: { userId, mediaId, rating },
  });
}

export async function getFavorite(userId: string, mediaId: string) {
  return await prisma.favorite.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });
}

export async function deleteFavorite(userId: string, mediaId: string) {
  // delete はレコードがないとエラーを吐くので deleteMany か
  // 存在チェック後の delete を推奨
  return await prisma.favorite.deleteMany({
    where: { userId, mediaId },
  });
}
