import { VisitedFolder } from "@/generated/prisma/client";
import {
  FolderFavoriteInfo,
  FolderMeta,
  FolderVisitedInfo,
} from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";

// 最近訪れたフォルダの一覧取得
export async function getRecentFolders(
  userId: string,
  length: number
): Promise<VisitedFolder[]> {
  return await prisma.visitedFolder.findMany({
    where: { userId },
    take: length,
    orderBy: [
      { isPinned: "desc" }, // 1. ピン留めされているものを上へ
      { lastViewedAt: "desc" }, // 2. その中で新しい順
    ],
  });
}

// 訪問済みフォルダのピン留めトグル
export async function togglePinVisitedFolder(
  userId: string,
  dirPath: string,
  currentPinned: boolean
) {
  return await prisma.visitedFolder.update({
    where: {
      userId_dirPath: { userId, dirPath },
    },
    data: {
      isPinned: !currentPinned,
    },
  });
}

// 訪問済みフォルダを更新
export async function updateVisitedFolder(
  dirPath: string,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.visitedFolder.upsert({
      where: {
        userId_dirPath: {
          userId,
          dirPath,
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        userId,
        dirPath,
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
    where: { path: { in: dirPaths } },
  });

  return metas.map((m) => ({
    ...m,
    totalSize: Number(m.totalSize),
  }));
}

// フォルダメタ情報更新
export async function updateFolderCache({
  path,
  directFiles,
  subFolderMetas,
}: {
  path: string;
  directFiles: { fileSize: number | null }[];
  subFolderMetas: { totalSize: number; fileCount: number }[]; // 先ほど取得した子フォルダのメタ情報
}) {
  // 1. 直下のファイルサイズを合計
  const directFilesSize = directFiles.reduce(
    (acc, f) => acc + (f.fileSize ?? 0),
    0
  );
  const directFilesCount = directFiles.length;

  // 2. 直下の子フォルダたちが持っている「それぞれの配下合計」を合算
  const subFoldersSize = subFolderMetas.reduce(
    (acc, m) => acc + m.totalSize,
    0
  );
  const subFoldersCount = subFolderMetas.reduce(
    (acc, m) => acc + m.fileCount,
    0
  );

  // 3. 自分自身の合計値を確定
  const totalSize = directFilesSize + subFoldersSize;
  const fileCount = directFilesCount + subFoldersCount;

  // 4. DB の FolderMeta に保存 (既存レコードがなければ作成、あれば更新)
  await prisma.folderMeta.upsert({
    where: { path },
    create: {
      path,
      totalSize,
      fileCount,
    },
    update: {
      totalSize,
      fileCount,
    },
  });
}
