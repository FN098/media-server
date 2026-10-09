import {
  DbFolder,
  DbVisitedFolder,
  FolderFavoriteInfo,
  FolderVisitedInfo,
} from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";

// フォルダID -> フォルダ
export async function getFolderById(id: string): Promise<DbFolder | null> {
  return await prisma.folder.findUnique({
    where: { id },
  });
}

// フォルダID -> フォルダ名
export async function getFolderNameById(id: string): Promise<string | null> {
  const folder = await prisma.folder.findUnique({
    select: { name: true },
    where: { id },
  });

  return folder?.name ?? null;
}

// 親フォルダID -> 子フォルダ
export async function getFolderByParentId(
  id: string | null
): Promise<DbFolder[]> {
  return await prisma.folder.findMany({
    where: { parentId: id },
  });
}

// ルートフォルダ
export async function getRootFolder(): Promise<DbFolder | null> {
  return await prisma.folder.findFirst({
    where: { parentId: null },
  });
}

interface FolderPathRow {
  id: string;
  parentId: string | null;
  name: string;
  depth: number;
}

// フォルダID -> フォルダパス
export async function getFolderPath(folderId: string): Promise<string> {
  const rows = await prisma.$queryRaw<FolderPathRow[]>`
    WITH RECURSIVE FolderHierarchy AS (
      -- アンカーメンバー
      SELECT 
        id, 
        parentId, 
        name, 
        0 AS depth,
        -- 訪問ログを保持 (例: '/id1/id2/')
        CONCAT('/', id, '/') AS path_visited
      FROM Folder
      WHERE id = ${folderId}

      UNION ALL

      -- 再帰メンバー
      SELECT 
        f.id, 
        f.parentId, 
        f.name, 
        fh.depth + 1,
        CONCAT(fh.path_visited, f.id, '/')
      FROM Folder f
      INNER JOIN FolderHierarchy fh ON f.id = fh.parentId
      -- 訪問済みの ID が含まれていない場合のみ結合を継続（ループ防止）
      WHERE LOCATE(CONCAT('/', f.id, '/'), fh.path_visited) = 0
    )
    SELECT id, parentId, name, depth
    FROM FolderHierarchy
    ORDER BY depth DESC;
  `;

  if (rows.length === 0) {
    throw new Error("Folder not found");
  }

  // 例: ["documents", "work", "projects"] -> "/documents/work/projects"
  const pathSegments = rows.map((row) => row.name);
  return "/" + pathSegments.join("/");
}

// 最近訪れたフォルダの一覧取得
export async function getRecentFolders(
  userId: string,
  length: number
): Promise<DbVisitedFolder[]> {
  return await prisma.visitedFolder.findMany({
    where: { userId },
    take: length,
    orderBy: [
      { isPinned: "desc" }, // 1. ピン留めされているものを上へ
      { visitedAt: "desc" }, // 2. その中で新しい順
    ],
  });
}

// 訪問済みフォルダのピン留めトグル
export async function togglePinVisitedFolder(
  userId: string,
  folderId: string,
  currentPinned: boolean
) {
  return await prisma.visitedFolder.update({
    where: {
      userId_folderId: { userId, folderId },
    },
    data: {
      isPinned: !currentPinned,
    },
  });
}

// 訪問済みフォルダを更新
export async function updateVisitedFolder(
  folderId: string,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.visitedFolder.upsert({
      where: {
        userId_folderId: {
          userId,
          folderId,
        },
      },
      update: {
        visitedAt: new Date(),
      },
      create: {
        userId,
        folderId,
      },
    });
  });
}

// フォルダ訪問履歴取得
export async function getFolderVisitedInfo(
  folderIds: string[],
  userId: string
): Promise<FolderVisitedInfo[]> {
  // 1. 指定されたいずれかのパスに前方一致するレコードをすべて取得
  const allRelatedFolders = await prisma.visitedFolder.findMany({
    where: {
      userId,
      OR: folderIds.map((d) => ({
        folderId: { startsWith: d },
      })),
    },
    select: {
      folderId: true,
      visitedAt: true,
    },
  });

  // 2. メモリ上で folderIds ごとに集計
  return folderIds.map((d) => {
    // このパス (d) で始まるレコードだけをフィルタリング
    const children = allRelatedFolders.filter((f) => f.folderId.startsWith(d));

    if (children.length === 0) {
      return {
        path: d,
        visitedAt: null,
      };
    }

    // フィルタリングされた中から最新の日付を特定
    const latestViewedAt = children.reduce(
      (latest, current) => {
        if (!current.visitedAt) return latest;
        if (!latest) return current.visitedAt;
        return current.visitedAt > latest ? current.visitedAt : latest;
      },
      null as Date | null
    );

    return {
      path: d,
      visitedAt: latestViewedAt,
    };
  });
}

// 各ディレクトリ内のお気に入り数を再帰的に取得
export async function getFolderFavoriteInfo(
  folderIds: string[],
  userId: string
): Promise<FolderFavoriteInfo[]> {
  // 1. 各ディレクトリごとの集計クエリ（Promise）の配列を作成
  const tasks = folderIds.map((d) =>
    prisma.userFileFavorite.aggregate({
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
  return folderIds.map((d, index) => {
    const aggregateResult = results[index];

    return {
      path: d,
      favoriteMediaCount: aggregateResult._count._all,
      averageRating: aggregateResult._avg.rating,
    };
  });
}

// フォルダメタ情報更新
export async function updateFolderCache({
  folderId,
  directFiles,
  subFolderMetas,
}: {
  folderId: string;
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

  // 4. DB の Folder に保存
  await prisma.folder.update({
    where: { id: folderId },
    data: {
      totalSize,
      fileCount,
    },
  });
}
