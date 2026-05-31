import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function upsertFavorite({
  userId,
  mediaId,
  rating,
}: {
  userId: string;
  mediaId: string;
  rating: number | null;
}): Promise<void> {
  await prisma.favorite.upsert({
    where: {
      userId_mediaId: { userId, mediaId },
    },
    update: { rating },
    create: { userId, mediaId, rating },
  });
}

export async function getFavorite({
  userId,
  mediaId,
}: {
  userId: string;
  mediaId: string;
}): Promise<{ rating: number | null } | null> {
  return await prisma.favorite.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
    select: {
      rating: true,
    },
  });
}

export async function deleteFavorite({
  userId,
  mediaId,
}: {
  userId: string;
  mediaId: string;
}): Promise<void> {
  // delete はレコードがないとエラーを吐くので deleteMany か
  // 存在チェック後の delete を推奨
  await prisma.favorite.deleteMany({
    where: { userId, mediaId },
  });
}

export async function upsertMultipleFavorites({
  data,
  rating,
}: {
  data: { userId: string; mediaId: string }[];
  rating: number | null;
}): Promise<void> {
  // NOTE: SQL一括処理高速化のため、rating はすべて同じ値で更新する
  await prisma.$executeRaw`
    INSERT INTO Favorite (userId, mediaId, rating)
    VALUES ${Prisma.join(
      data.map(
        ({ userId, mediaId }) => Prisma.sql`(${userId}, ${mediaId}, ${rating})`
      )
    )}
    ON DUPLICATE KEY UPDATE rating = VALUES(rating)
  `;
}

export async function getMultipleFavorites({
  userId,
  mediaIds,
}: {
  userId: string;
  mediaIds: string[];
}): Promise<{ path: string; rating: number | null }[]> {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      mediaId: {
        in: mediaIds,
      },
    },
    select: {
      rating: true,
      media: {
        select: {
          path: true,
        },
      },
    },
  });

  return favorites.map((f) => ({
    path: f.media.path,
    rating: f.rating,
  }));
}

export async function deleteMultipleFavorites({
  userId,
  mediaIds,
}: {
  userId: string;
  mediaIds: string[];
}): Promise<{ count: number }> {
  return await prisma.favorite.deleteMany({
    where: {
      userId,
      mediaId: {
        in: mediaIds,
      },
    },
  });
}
