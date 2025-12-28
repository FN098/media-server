import type { VisitedFolder } from "@/generated/prisma/client";
import { DbFavoriteInfo, DbVisitedInfo } from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";

export async function getRecentFolders(
  userId: string,
  length: number
): Promise<VisitedFolder[]> {
  return await prisma.visitedFolder.findMany({
    where: { userId },
    take: length,
    orderBy: { lastViewedAt: "desc" },
  });
}

export async function getDbVisitedInfo(
  dirPaths: string[],
  userId: string
): Promise<DbVisitedInfo[]> {
  const folders = await prisma.visitedFolder.findMany({
    select: {
      dirPath: true,
      lastViewedAt: true,
    },
    where: {
      userId,
      dirPath: { in: dirPaths },
    },
  });

  return folders.map((e) => ({
    path: e.dirPath,
    lastViewedAt: e.lastViewedAt,
  }));
}

export async function getDbFavoriteCount(
  dirPaths: string[],
  userId: string
): Promise<DbFavoriteInfo[]> {
  return await Promise.all(
    dirPaths.map(async (d) => {
      const count = await prisma.favorite.count({
        where: {
          media: { path: { startsWith: d + "/" } },
          userId,
        },
      });

      return {
        path: d,
        favoriteCountInFolder: count,
      } satisfies DbFavoriteInfo;
    })
  );
}
