import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

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

export async function upsertMultipleFavorites(
  data: {
    userId: string;
    mediaId: string;
  }[],
  rating: number | null
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO Favorite (userId, mediaId, rating)
    VALUES ${Prisma.join(
      data.map((d) => Prisma.sql`(${d.userId}, ${d.mediaId}, ${rating})`)
    )}
    ON DUPLICATE KEY UPDATE rating = VALUES(rating)
  `;
}

export async function getMultipleFavorites(
  userId: string,
  mediaIds: string[]
): Promise<{ path: string; rating: number | null }[]> {
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

export async function deleteMultipleFavorites(
  userId: string,
  mediaIds: string[]
): Promise<{ count: number }> {
  return await prisma.favorite.deleteMany({
    where: {
      userId,
      mediaId: {
        in: mediaIds,
      },
    },
  });
}
