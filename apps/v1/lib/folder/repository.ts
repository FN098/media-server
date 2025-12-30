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

export async function getDbVisitedInfoDeeply(
  dirPaths: string[],
  userId: string
): Promise<DbVisitedInfo[]> {
  // 対象のフォルダの子孫を含めすべて取得
  return Promise.all(
    dirPaths.map(async (d) => {
      const folders = await prisma.visitedFolder.findMany({
        select: {
          dirPath: true,
          lastViewedAt: true,
        },
        where: {
          userId,
          dirPath: { startsWith: d },
        },
      });

      if (folders.length === 0)
        return {
          path: d,
          lastViewedAt: null,
        };

      const latestViewedAt = folders
        .map((f) => f.lastViewedAt)
        .reduce((a, b) => {
          return a > b ? a : b;
        });

      return {
        path: d,
        lastViewedAt: latestViewedAt,
      } satisfies DbVisitedInfo;
    })
  );
}

export async function getDbFavoriteCount(
  dirPaths: string[],
  userId: string
): Promise<DbFavoriteInfo[]> {
  // 1. クエリの「準備」だけを行う（まだ実行しない）
  const tasks = dirPaths.map((d) =>
    prisma.favorite.count({
      where: {
        userId,
        media: { path: { startsWith: d + "/" } },
      },
    })
  );

  // 2. 100個のクエリを一括で DB に送信
  const counts = await prisma.$transaction(tasks);

  // 3. 結果をマッピング
  return dirPaths.map((d, index) => ({
    path: d,
    favoriteCountInFolder: counts[index],
  }));
}
