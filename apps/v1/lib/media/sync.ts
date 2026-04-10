import type { MediaFsNode, PrismaMedia } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

type MediaCreateItem = Pick<
  PrismaMedia,
  "path" | "dirPath" | "title" | "fileMtime" | "fileSize" | "previewPath"
>;

type MediaUpdateItem = Pick<
  PrismaMedia,
  "path" | "title" | "fileMtime" | "fileSize" | "previewPath"
>;

export async function syncMediaDir(dirPath: string, nodes: MediaFsNode[]) {
  const files = nodes.filter((n) => !n.isDirectory);
  // ファイルが空でも、ディレクトリが存在するなら FolderMeta は更新したい場合があるため
  // 早期リターンはせず、ロジックを進めます。

  // --- 1. プレビュー候補の抽出 ---
  const firstMedia = files.find(
    (f) => f.type === "image" || f.type === "video"
  );

  const previewPathMap = new Map<string, string>();
  files.forEach((f) => {
    if (f.type === "image" || f.type === "video") {
      const baseName = f.name.replace(/\.[^/.]+$/, "");
      if (!previewPathMap.has(baseName)) previewPathMap.set(baseName, f.path);
    }
  });

  // --- 2. 各ファイルのメタデータ準備 ---
  const fsMap = new Map(
    files.map((f) => {
      let previewPath: string | null = null;
      if (f.type === "audio") {
        const baseName = f.name.replace(/\.[^/.]+$/, "");
        previewPath = previewPathMap.get(baseName) ?? firstMedia?.path ?? null;
      }

      return [
        f.path,
        {
          title: f.name,
          fileMtime: f.mtime,
          fileSize: f.size,
          previewPath,
        },
      ];
    })
  );

  // --- 3. DB状態との比較 ---
  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: { id: true, path: true, fileMtime: true, previewPath: true },
  });
  const dbMap = new Map(dbMedia.map((m) => [m.path, m]));

  const toInsert: MediaCreateItem[] = [];
  const toUpdate: MediaUpdateItem[] = [];

  for (const [path, meta] of fsMap) {
    const dbMeta = dbMap.get(path);

    if (!dbMeta) {
      // 新規挿入
      toInsert.push({
        path,
        dirPath,
        title: meta.title,
        fileMtime: meta.fileMtime,
        fileSize: meta.fileSize ? BigInt(meta.fileSize) : null,
        previewPath: meta.previewPath,
      });
    } else if (
      dbMeta.fileMtime.getTime() !== meta.fileMtime.getTime() ||
      dbMeta.previewPath !== meta.previewPath // プレビューパスが変わった場合も更新対象
    ) {
      // 更新
      toUpdate.push({
        path,
        title: meta.title,
        fileMtime: meta.fileMtime,
        fileSize: meta.fileSize ? BigInt(meta.fileSize) : null,
        previewPath: meta.previewPath,
      });
    }
  }

  const toDelete = dbMedia.filter((m) => !fsMap.has(m.path)).map((m) => m.path);

  // --- 4. トランザクション実行 ---
  await prisma.$transaction(async (tx) => {
    // Media 削除・挿入・更新
    if (toDelete.length > 0) {
      await tx.media.deleteMany({ where: { path: { in: toDelete } } });
    }
    if (toInsert.length > 0) {
      await tx.media.createMany({ data: toInsert, skipDuplicates: true });
    }
    for (const u of toUpdate) {
      await tx.media.update({
        where: { path: u.path },
        data: {
          title: u.title,
          fileMtime: u.fileMtime,
          fileSize: u.fileSize,
          previewPath: u.previewPath,
        },
      });
    }

    // FolderMeta 更新
    // このディレクトリ自体のプレビューパスを保存
    await tx.folderMeta.upsert({
      where: { path: dirPath },
      update: { previewPath: firstMedia?.path ?? null },
      create: { path: dirPath, previewPath: firstMedia?.path ?? null },
    });
  });
}
