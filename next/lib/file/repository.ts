import { db } from "@/lib/prisma";

// フォルダ内のファイル情報取得
export async function getDbFiles(parentFolderId: string, userId: string) {
  const dbFiles = await db.file.findMany({
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

  return dbFiles.map((f) => ({
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

export type DbFiles = Awaited<ReturnType<typeof getDbFiles>>;
