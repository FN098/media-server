import type { VisitedFolder } from "@/generated/prisma/client";
import { DbFavoriteInfo, DbVisitedInfo } from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";
import path from "path";

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
  parentDirPath: string,
  userId: string
): Promise<DbVisitedInfo[]> {
  // 対象のフォルダの子孫を含めすべて取得
  const folders = await prisma.visitedFolder.findMany({
    select: {
      dirPath: true,
      lastViewedAt: true,
    },
    where: {
      userId,
      dirPath: { startsWith: parentDirPath },
    },
  });

  // parentDirPath が "/work" の場合、"/work/projectA/src" の直下フォルダは "projectA"
  const summaryMap = new Map<string, Date>();

  for (const folder of folders) {
    // 1. parentDirPath の直後のパス部分を特定する
    // 例: parent="a", path="a/b/c" -> "b" を取り出す
    const relativePath = folder.dirPath
      .slice(parentDirPath.length)
      .replace(/^\//, "");
    const topLevelName = relativePath.split("/")[0];

    // 直下フォルダのフルパスをキーにする
    const groupKey = path.join(parentDirPath, topLevelName);

    // 2. そのグループ内での最大値を更新
    const currentMax = summaryMap.get(groupKey);
    if (!currentMax || folder.lastViewedAt > currentMax) {
      summaryMap.set(groupKey, folder.lastViewedAt);
    }
  }

  // Map を配列に変換して返す
  return Array.from(summaryMap.entries()).map(([path, lastViewedAt]) => ({
    path,
    lastViewedAt,
  }));
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
