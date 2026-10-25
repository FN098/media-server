import { db } from "@/__lib/prisma";
import { omit } from "@/__lib/utils/object";
import { cache } from "react";

const ROOT_FOLDER_NAME = "";

async function _getRootFolder() {
  return await db.folder.findFirst({
    where: { parentFolderId: null, name: ROOT_FOLDER_NAME },
  });
}

export const getRootFolder = cache(_getRootFolder);

export async function createRootFolder() {
  return await db.folder.create({
    data: { parentFolderId: null, name: ROOT_FOLDER_NAME, mtime: new Date() },
  });
}

export async function getFolder(id: string, userId: string) {
  const folder = await db.folder.findUnique({
    where: { id },
    include: {
      userFolderFavorites: {
        where: { userId },
      },
    },
  });

  if (!folder) return null;

  return {
    ...omit(folder, "userFolderFavorites"),
    size: Number(folder.totalSize),
    favoritedAt: folder.userFolderFavorites[0]?.updatedAt ?? null,
    isDirectory: true as const,
  };
}

export async function createFolders(path: string) {
  const segments = path.split("/").filter(Boolean);

  const root = await getRootFolder();

  if (!root) {
    throw new Error("Root not found");
  }

  let parentFolderId: string = root.id;
  let folderId: string | null = null;

  for (const name of segments) {
    let folder = await db.folder.findFirst({
      where: {
        parentFolderId,
        name,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!folder) {
      folder = await db.folder.create({
        data: {
          parentFolderId,
          name,
          mtime: new Date(),
        },
        select: {
          id: true,
        },
      });
    }

    folderId = folder.id;
    parentFolderId = folder.id;
  }

  return folderId!!;
}

// フォルダID -> フォルダ名
export async function getFolderName(id: string) {
  const folder = await db.folder.findUnique({
    select: { name: true },
    where: { id },
  });

  return folder?.name ?? null;
}

// フォルダID -> 親フォルダID
export async function getParentFolderId(id: string) {
  const folder = await db.folder.findUnique({
    select: { parentFolderId: true },
    where: { id },
  });

  return folder?.parentFolderId ?? null;
}

interface FolderPathRow {
  id: string;
  parentFolderId: string | null;
  name: string;
  depth: number;
}

// フォルダID -> フォルダパス
export async function getFolderPathTree(folderId: string) {
  const rows = await db.$queryRaw<FolderPathRow[]>`
    WITH RECURSIVE FolderHierarchy AS (
      -- アンカーメンバー
      SELECT 
        id, 
        parentFolderId, 
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
        f.parentFolderId, 
        f.name, 
        fh.depth + 1,
        CONCAT(fh.path_visited, f.id, '/')
      FROM Folder f
      INNER JOIN FolderHierarchy fh ON f.id = fh.parentFolderId
      -- 訪問済みの ID が含まれていない場合のみ結合を継続（ループ防止）
      WHERE LOCATE(CONCAT('/', f.id, '/'), fh.path_visited) = 0
    )
    SELECT id, parentFolderId, name, depth
    FROM FolderHierarchy
    ORDER BY depth DESC;
  `;

  if (rows.length === 0) {
    throw new Error("Folder not found");
  }

  return rows;
}

export async function getFolderPath(folderId: string) {
  const rows = await getFolderPathTree(folderId);

  // 例: ["documents", "work", "projects"] -> "/documents/work/projects"
  const pathSegments = rows.map((row) => row.name);
  return "/" + pathSegments.join("/");
}

// 最近訪れたフォルダの一覧取得
export async function getRecentVisitedFolders(userId: string, length: number) {
  const folders = await db.visitedFolder.findMany({
    where: { userId },
    take: length,
    orderBy: [
      { isPinned: "desc" }, // 1. ピン留めされているものを上へ
      { visitedAt: "desc" }, // 2. その中で新しい順
    ],
    include: {
      folder: {
        select: {
          name: true,
        },
      },
    },
  });

  return folders.map((f) => ({
    ...omit(f, "folder"),
    name: f.folder.name,
  }));
}

// 訪問済みフォルダのピン留めトグル
export async function togglePinVisitedFolder(
  userId: string,
  folderId: string,
  currentPinned: boolean
) {
  return await db.visitedFolder.update({
    where: {
      userId_folderId: { userId, folderId },
    },
    data: {
      isPinned: !currentPinned,
    },
  });
}

// 訪問済みフォルダを更新
export async function updateVisitedFolder(folderId: string, userId: string) {
  await db.$transaction(async (tx) => {
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
export async function getVisitedFolders(folderIds: string[], userId: string) {
  return db.visitedFolder.findMany({
    where: {
      userId,
      folderId: { in: folderIds },
    },
    select: {
      folderId: true,
      visitedAt: true,
    },
  });
}

// フォルダノード取得
export async function getDbFolders(parentFolderId: string, userId: string) {
  const dbFolders = await db.folder.findMany({
    where: { parentFolderId },
    select: {
      id: true,
      parentFolderId: true,
      previewFileId: true,
      name: true,
      fileCount: true,
      totalSize: true,
      isLocked: true,
      deletedAt: true,
      userFolderFavorites: {
        where: { userId },
        select: { updatedAt: true },
      },
    },
  });

  return dbFolders.map((f) => ({
    id: f.id,
    parentFolderId: f.parentFolderId,
    previewFileId: f.previewFileId,
    name: f.name,
    fileCount: f.fileCount,
    totalSize: Number(f.totalSize),
    isLocked: f.isLocked,
    deletedAt: f.deletedAt,
    favoritedAt: f.userFolderFavorites[0]?.updatedAt ?? null,
  }));
}

export type DbFolders = Awaited<ReturnType<typeof getDbFolders>>;

// フォルダキャッシュ情報更新
export async function updateFolderCache(
  folderId: string,
  files: { size: number | null }[],
  folders: { totalSize: number; fileCount: number }[]
) {
  // 1. 直下のファイルを集計
  const totalFileSize = files.reduce((acc, f) => acc + (f.size ?? 0), 0);
  const totalFileCount = files.length;

  // 2. 直下のフォルダを集計
  const totalFolderSize = folders.reduce((acc, m) => acc + m.totalSize, 0);
  const totalFolderCount = folders.reduce((acc, m) => acc + m.fileCount, 0);

  // 3. 自分自身の合計値を確定
  const totalSize = totalFileSize + totalFolderSize;
  const fileCount = totalFileCount + totalFolderCount;

  // 4. DB に保存
  await db.folder.update({
    where: { id: folderId },
    data: {
      totalSize,
      fileCount,
    },
  });
}

// フォルダタイムスタンプ更新
export async function updateFolderTimestamp({
  id,
  mtime = new Date(),
}: {
  id: string;
  mtime?: Date;
}) {
  await db.folder.update({
    where: { id },
    data: { mtime },
  });
}
