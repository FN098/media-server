import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";

export async function isFavoriteFolder({
  userId,
  folderId,
}: {
  userId: string;
  folderId: string;
}) {
  const existing = await db.userFolderFavorite.findUnique({
    where: {
      userId_folderId: { userId, folderId },
    },
    select: {
      updatedAt: true,
    },
  });

  return existing != null;
}

export async function getFavoriteFolders({
  userId,
  folderIds,
}: {
  userId: string;
  folderIds: string[];
}) {
  const favorites = await db.userFolderFavorite.findMany({
    where: {
      userId,
      folderId: {
        in: folderIds,
      },
    },
    select: {
      folderId: true,
    },
  });

  const favoriteSet = new Set(favorites.map((f) => f.folderId));

  return folderIds.map((id) => ({
    folderId: id,
    isFavorite: favoriteSet.has(id),
  }));
}

export async function addFavoriteFolder({
  userId,
  folderId,
}: {
  userId: string;
  folderId: string;
}) {
  await db.userFolderFavorite.upsert({
    where: {
      userId_folderId: { userId, folderId },
    },
    update: {},
    create: { userId, folderId },
  });
}

export async function addFavoriteFolders({
  userId,
  folderIds,
}: {
  userId: string;
  folderIds: string[];
}) {
  await db.$executeRaw`
    INSERT IGNORE INTO UserFolderFavorite (userId, folderId)
    VALUES ${Prisma.join(
      folderIds.map((folderId) => Prisma.sql`(${userId}, ${folderId})`)
    )}
  `;
}

export async function removeFavoriteFolder({
  userId,
  folderId,
}: {
  userId: string;
  folderId: string;
}) {
  await db.userFolderFavorite.deleteMany({
    where: { userId, folderId },
  });
}

export async function removeFavoriteFolders({
  userId,
  folderIds,
}: {
  userId: string;
  folderIds: string[];
}) {
  return await db.userFolderFavorite.deleteMany({
    where: {
      userId,
      folderId: {
        in: folderIds,
      },
    },
  });
}
