import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";

export async function isFavoriteFile({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  const existing = await db.userFileFavorite.findUnique({
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
  const favorites = await db.userFileFavorite.findMany({
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

export async function addFavoriteFile({
  userId,
  fileId,
}: {
  userId: string;
  fileId: string;
}) {
  await db.userFileFavorite.upsert({
    where: {
      userId_fileId: { userId, fileId },
    },
    update: {},
    create: { userId, fileId },
  });
}

export async function addFavoriteFiles({
  userId,
  fileIds,
}: {
  userId: string;
  fileIds: string[];
}) {
  await db.$executeRaw`
    INSERT IGNORE INTO UserFileFavorite (userId, fileId)
    VALUES ${Prisma.join(
      fileIds.map((fileId) => Prisma.sql`(${userId}, ${fileId})`)
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
  await db.userFileFavorite.deleteMany({
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
  return await db.userFileFavorite.deleteMany({
    where: {
      userId,
      fileId: {
        in: fileIds,
      },
    },
  });
}
