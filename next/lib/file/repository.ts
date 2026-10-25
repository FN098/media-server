import { db } from "@/__lib/prisma";
import { getFolderPath } from "@/lib/folder/repository";

// フォルダ内のファイル情報取得
export async function getFiles(parentFolderId: string, userId: string) {
  const files = await db.file.findMany({
    where: { parentFolderId },
    select: {
      id: true,
      parentFolderId: true,
      previewFileId: true,
      name: true,
      type: true,
      mtime: true,
      size: true,
      isLocked: true,
      deletedAt: true,
      userFileFavorites: {
        where: { userId },
        select: { updatedAt: true },
      },
      fileTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return files.map((f) => ({
    id: f.id,
    parentFolderId: f.parentFolderId,
    previewFileId: f.previewFileId,
    name: f.name,
    type: f.type,
    mtime: f.mtime,
    size: Number(f.size),
    isLocked: f.isLocked,
    deletedAt: f.deletedAt,
    favoritedAt: f.userFileFavorites[0]?.updatedAt ?? null,
    tags: f.fileTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
  }));
}

export type DbFiles = Awaited<ReturnType<typeof getFiles>>;

// ファイルID -> ファイルパス
export async function getFilePath(fileId: string) {
  const file = await db.file.findUnique({
    where: { id: fileId },
    select: {
      name: true,
      folderId: true,
    },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const folderPath = await getFolderPath(file.folderId);

  return `${folderPath}/${file.name}`;
}

// ファイルタイムスタンプ更新
export async function updateFileTimestamp({
  id,
  mtime = new Date(),
}: {
  id: string;
  mtime?: Date;
}) {
  await db.file.update({
    where: { id },
    data: { mtime },
  });
}
