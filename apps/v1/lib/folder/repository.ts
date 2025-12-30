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
  // 1. 各パスに対するクエリ（Promise）の配列を作成
  const tasks = dirPaths.map((d) =>
    prisma.visitedFolder.findMany({
      select: {
        lastViewedAt: true,
      },
      where: {
        userId,
        dirPath: { startsWith: d },
      },
    })
  );

  // 2. $transaction で一括実行
  // results はフォルダオブジェクトの配列の配列になります: VisitFolder[][]
  const results = await prisma.$transaction(tasks);

  // 3. 結果を元のパスと紐付けて加工
  return dirPaths.map((path, index) => {
    const folders = results[index];

    if (folders.length === 0) {
      return {
        path,
        lastViewedAt: null,
      };
    }

    // 取得したレコードの中から最新の時刻を算出
    const latestViewedAt = folders
      .map((f) => f.lastViewedAt)
      .filter((date): date is Date => date !== null) // null除外（DB設計による）
      .reduce((a, b) => (a > b ? a : b), new Date(0));

    return {
      path,
      lastViewedAt: latestViewedAt.getTime() === 0 ? null : latestViewedAt,
    } satisfies DbVisitedInfo;
  });
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
