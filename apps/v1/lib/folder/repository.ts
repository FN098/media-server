import type { VisitedFolder } from "@/generated/prisma/client";
import {
  FolderFavoriteInfo,
  FolderMeta,
  FolderVisitedInfo,
} from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

// 最近訪れたフォルダの一覧取得
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

// 最近訪れたフォルダを更新
export async function updateVisitedFolder(
  dirPath: string,
  userId: string
): Promise<void> {
  const normalizedDirPath = dirPath.replace(/\/+$/, "");

  await prisma.$transaction(async (tx) => {
    await tx.visitedFolder.upsert({
      where: {
        userId_dirPath: {
          userId,
          dirPath: normalizedDirPath,
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        userId,
        dirPath: normalizedDirPath,
      },
    });
  });
}

// フォルダ訪問履歴取得
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

// 各ディレクトリ内のお気に入り数を再帰的に取得
export async function getFolderFavoriteInfo(
  dirPaths: string[],
  userId: string
): Promise<FolderFavoriteInfo[]> {
  // 1. 各ディレクトリごとの集計クエリ（Promise）の配列を作成
  const tasks = dirPaths.map((d) =>
    prisma.favorite.aggregate({
      where: {
        userId,
        media: { path: { startsWith: d + "/" } },
      },
      _count: {
        _all: true, // お気に入り登録されている総数
      },
      _avg: {
        rating: true, // ratingの平均値（nullのレコードは自動で除外されて計算されます）
      },
    })
  );

  // 2. トランザクションで一括実行
  const results = await prisma.$transaction(tasks);

  // 3. 結果をマッピングして返す
  return dirPaths.map((d, index) => {
    const aggregateResult = results[index];

    return {
      path: d,
      favoriteMediaCount: aggregateResult._count._all,
      averageRating: aggregateResult._avg.rating,
    };
  });
}

// フォルダメタ情報取得
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
