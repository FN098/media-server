import { MediaFsNode } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

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

  // --- INSERT ---
  const toInsert = [];
  for (const [path, meta] of fsMap) {
    if (!dbMap.has(path)) {
      toInsert.push({
        id: randomUUID(),
        path,
        dirPath,
        title: meta.title,
        fileMtime: meta.fileMtime,
        fileSize: meta.fileSize,
      });
    }
  }

  if (toInsert.length > 0) {
    await prisma.media.createMany({
      data: toInsert,
      skipDuplicates: true,
    });
  }

  // --- UPDATE ---
  const toUpdate = [];
  for (const [path, meta] of fsMap) {
    const dbMeta = dbMap.get(path);
    if (!dbMeta) continue;

    if (dbMeta.fileMtime.getTime() !== meta.fileMtime.getTime()) {
      toUpdate.push({ path, ...meta });
    }
  }

  // Prismaの制限上、updateManyは条件別に必要
  for (const u of toUpdate) {
    await prisma.media.update({
      where: { path: u.path },
      data: {
        title: u.title,
        fileMtime: u.fileMtime,
        fileSize: u.fileSize,
      },
    });
  }

  // --- DELETE ---
  const fsPaths = new Set(fsMap.keys());
  const toDelete = dbMedia
    .filter((m) => !fsPaths.has(m.path))
    .map((m) => m.path);

  if (toDelete.length > 0) {
    await prisma.media.deleteMany({
      where: { path: { in: toDelete } },
    });
  }

  console.log("sync completed");
}
