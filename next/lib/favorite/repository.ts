import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function isFavorite({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  const existing = await prisma.userFileFavorite.findUnique({
    where: {
      userId_fileId: { userId, fileId },
    },
    select: {
      updatedAt: true,
    },
  });

  return existing != null;
}

export async function deleteFavorite({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}): Promise<void> {
  await prisma.userFileFavorite.deleteMany({
    where: { userId, fileId },
  });
}

export async function upsertManyFavorites({
  data,
}: {
  data: { userId: string; fileId: string }[];
}): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO Favorite (userId, fileId)
    VALUES ${Prisma.join(
      data.map(({ userId, fileId }) => Prisma.sql`(${userId}, ${fileId})`)
    )}
    ON DUPLICATE KEY DO NOTHING
  `;
}

export async function getManyFavorites({
  userId,
  fileIds,
}: {
  userId: string;
  fileIds: string[];
}): Promise<{ path: string; rating: number | null }[]> {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      fileId: {
        in: fileIds,
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

export async function deleteManyFavorites({
  userId,
  fileIds,
}: {
  userId: string;
  fileIds: string[];
}): Promise<{ count: number }> {
  return await prisma.favorite.deleteMany({
    where: {
      userId,
      fileId: {
        in: fileIds,
      },
    },
  });
}
