import type { VisitedFolder } from "@/generated/prisma/client";
import {
  FolderFavoriteInfo,
  FolderMeta,
  FolderVisitedInfo,
} from "@/lib/media/types";
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

export async function getFolderVisitedInfo(
  dirPaths: string[],
  userId: string
): Promise<FolderVisitedInfo[]> {
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

export async function getFolderFavoriteInfo(
  dirPaths: string[],
  userId: string
): Promise<FolderFavoriteInfo[]> {
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

export async function getFolderMetas(
  dirPaths: string[]
): Promise<FolderMeta[]> {
  const metas = await prisma.folderMeta.findMany({
    where: {
      path: { in: dirPaths },
    },
    select: {
      path: true,
      previewPath: true,
      title: true,
    },
  });

  return metas.map((m) => ({
    path: m.path,
    previewPath: m.previewPath,
    title: m.title,
  }));
}
