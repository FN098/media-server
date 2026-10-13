import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function isFavoriteFile({
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

export async function getFavoriteFiles({
  userId,
  fileIds,
}: {
  userId: string;
  fileIds: string[];
}) {
  const favorites = await prisma.userFileFavorite.findMany({
    where: {
      userId,
      fileId: {
        in: fileIds,
      },
    },
    select: {
      fileId: true,
    },
  });

  const favoriteSet = new Set(favorites.map((f) => f.fileId));

  return fileIds.map((id) => ({
    fileId: id,
    isFavorite: favoriteSet.has(id),
  }));
}

export async function updateFavoriteFiles({
  data,
}: {
  data: { userId: string; fileId: string }[];
}) {
  await prisma.$executeRaw`
    INSERT IGNORE INTO UserFileFavorite (userId, fileId)
    VALUES ${Prisma.join(
      data.map(({ userId, fileId }) => Prisma.sql`(${userId}, ${fileId})`)
    )}
  `;
}

export async function removeFavoriteFile({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  await prisma.userFileFavorite.deleteMany({
    where: { userId, fileId },
  });
}

export async function removeFavoriteFiles({
  userId,
  fileIds,
}: {
  userId: string;
  fileIds: string[];
}) {
  return await prisma.userFileFavorite.deleteMany({
    where: {
      userId,
      fileId: {
        in: fileIds,
      },
    },
  });
}
