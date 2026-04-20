import { prisma } from "@/lib/prisma";

export async function upsertFavorite(
  userId: string,
  mediaId: string,
  rating: number | null
): Promise<void> {
  await prisma.favorite.upsert({
    where: {
      userId_mediaId: { userId, mediaId },
    },
    update: { rating },
    create: { userId, mediaId, rating },
  });
}

export async function getFavorite(
  userId: string,
  mediaId: string
): Promise<{ rating: number | null } | null> {
  return await prisma.favorite.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
    select: {
      rating: true,
    },
  });
}

export async function deleteFavorite(
  userId: string,
  mediaId: string
): Promise<{ count: number }> {
  // delete はレコードがないとエラーを吐くので deleteMany か
  // 存在チェック後の delete を推奨
  return await prisma.favorite.deleteMany({
    where: { userId, mediaId },
  });
}
