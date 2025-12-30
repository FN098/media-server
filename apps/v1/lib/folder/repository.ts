import type { VisitedFolder } from "@/generated/prisma/client";
import { DbFavoriteInfo, DbVisitedInfo } from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";
import { benchmark } from "@/lib/utils/benchmark";

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
  userId: string,
  strategy: "single" | "transaction" = "single"
): Promise<DbVisitedInfo[]> {
  // シングルクエリのほうがトランザクションより5倍くらい速い
  switch (strategy) {
    case "single":
      return await getDbVisitedInfoDeeplyWithSingleQuery(dirPaths, userId);

    case "transaction":
      return await getDbVisitedInfoDeeplyWithTransaction(dirPaths, userId);
  }
}

export async function benchGetDbVisitedInfoDeeply(
  dirPaths: string[],
  userId: string
): Promise<void> {
  await benchmark(`Performance Test (dirPaths count: ${dirPaths.length})`, [
    {
      // 結果: 50ms / 18 dirs
      name: "Transaction Method",
      callback: async () => {
        await getDbVisitedInfoDeeplyWithTransaction(dirPaths, userId);
      },
    },
    {
      // 結果: 10ms / 18 dirs
      name: "Single Query Method",
      callback: async () => {
        await getDbVisitedInfoDeeplyWithSingleQuery(dirPaths, userId);
      },
    },
  ]);
}

// Transaction 方式（DBサーバー負荷↑）
export async function getDbVisitedInfoDeeplyWithTransaction(
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
      orderBy: {
        lastViewedAt: "desc",
      },
      take: 1,
    })
  );

  // 2. $transaction で一括実行
  // results はフォルダオブジェクトの配列の配列になります: VisitFolder[][]
  const results = await prisma.$transaction(tasks);

  // 3. 結果を元のパスと紐付けて加工
  return dirPaths.map((d, index) => {
    const latest = results[index];

    if (latest.length === 0) {
      return {
        path: d,
        lastViewedAt: null,
      };
    }

    return {
      path: d,
      lastViewedAt: latest[0].lastViewedAt,
    } satisfies DbVisitedInfo;
  });
}

// Single Query 方式（WEBサーバー負荷↑）
export async function getDbVisitedInfoDeeplyWithSingleQuery(
  dirPaths: string[],
  userId: string
): Promise<DbVisitedInfo[]> {
  // 1. 指定されたいずれかのパスに前方一致するレコードをすべて取得
  const allRelatedFolders = await prisma.visitedFolder.findMany({
    where: {
      userId,
      OR: dirPaths.map((d) => ({
        dirPath: { startsWith: d },
      })),
    },
    select: {
      dirPath: true,
      lastViewedAt: true,
    },
  });

  // 2. メモリ上で dirPaths ごとに集計
  return dirPaths.map((d) => {
    // このパス (d) で始まるレコードだけをフィルタリング
    const children = allRelatedFolders.filter((f) => f.dirPath.startsWith(d));

    if (children.length === 0) {
      return {
        path: d,
        lastViewedAt: null,
      };
    }

    // フィルタリングされた中から最新の日付を特定
    const latestViewedAt = children.reduce(
      (latest, current) => {
        if (!current.lastViewedAt) return latest;
        if (!latest) return current.lastViewedAt;
        return current.lastViewedAt > latest ? current.lastViewedAt : latest;
      },
      null as Date | null
    );

    return {
      path: d,
      lastViewedAt: latestViewedAt,
    };
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
