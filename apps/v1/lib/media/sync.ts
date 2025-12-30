import { Media } from "@/generated/prisma";
import { MediaFsNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

export async function syncMediaDir(dirPath: string, nodes: MediaFsNode[]) {
  const files = nodes.filter((n) => !n.isDirectory);
  if (files.length === 0) return;

  const fsMap = new Map(
    files.map((f) => [
      f.path,
      {
        title: f.name,
        fileMtime: f.mtime,
        fileSize: f.size,
      },
    ])
  );

  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: { id: true, path: true, fileMtime: true },
  });

  const dbMap = new Map(dbMedia.map((m) => [m.path, m]));

  // --- 差分計算 ---
  const toInsert: Omit<Media, "id" | "createdAt" | "updatedAt">[] = [];
  for (const [path, meta] of fsMap) {
    if (!dbMap.has(path)) {
      toInsert.push({
        path,
        dirPath,
        title: meta.title,
        fileMtime: meta.fileMtime,
        fileSize: meta.fileSize ? BigInt(meta.fileSize) : null,
      });
    }
  }

  const toUpdate: Omit<Media, "id" | "dirPath" | "createdAt" | "updatedAt">[] =
    [];
  for (const [path, meta] of fsMap) {
    const dbMeta = dbMap.get(path);
    if (dbMeta && dbMeta.fileMtime.getTime() !== meta.fileMtime.getTime()) {
      toUpdate.push({
        ...meta,
        path,
        fileSize: meta.fileSize ? BigInt(meta.fileSize) : null,
      });
    }
  }

  const fsPaths = new Set(fsMap.keys());
  const toDelete = dbMedia
    .filter((m) => !fsPaths.has(m.path))
    .map((m) => m.path);

  // --- トランザクション実行 ---
  await prisma.$transaction(async (tx) => {
    // 1. 削除
    if (toDelete.length > 0) {
      await tx.media.deleteMany({
        where: { path: { in: toDelete } },
      });
    }

    // 2. 挿入
    if (toInsert.length > 0) {
      await tx.media.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
    }

    // 3. 更新 (ループによるクエリ発行)
    for (const u of toUpdate) {
      await tx.media.update({
        where: { path: u.path },
        data: {
          title: u.title,
          fileMtime: u.fileMtime,
          fileSize: u.fileSize,
        },
      });
    }
  });
}
