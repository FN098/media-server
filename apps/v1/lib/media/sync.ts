import { isMedia } from "@/lib/media/media-types";
import { sortNodes } from "@/lib/media/sort";
import type { MediaFsNode, MediaType, PrismaMedia } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";
import { getFilenameWithoutExt } from "@/lib/utils/filename";

type MediaCreateItem = Pick<
  PrismaMedia,
  "path" | "dirPath" | "fileMtime" | "fileSize" | "previewPath" | "type"
>;

type MediaUpdateItem = Pick<
  PrismaMedia,
  "path" | "fileMtime" | "fileSize" | "previewPath" | "type"
>;

export async function syncMediaDir(dirPath: string, nodes: MediaFsNode[]) {
  let mediaOnly = nodes.filter((n) => isMedia(n.type));

  // プレビュー候補は名前順で先頭に近いものを優先する
  mediaOnly = sortNodes(mediaOnly, {
    key: "name",
    direction: "asc",
  });

  // --- 1. プレビュー候補の抽出 ---
  const firstMedia = mediaOnly.find(
    (f) => f.type === "image" || f.type === "video"
  );

  const imageMap = new Map<string, string>();

  mediaOnly.forEach((f) => {
    if (f.type === "image") {
      const baseName = f.name.replace(/\.[^/.]+$/, "");
      if (!imageMap.has(baseName)) imageMap.set(baseName, f.path);
    }
  });

  // --- 2. DB状態の取得 ---
  // 比較のために早めに取得します
  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: { id: true, path: true, fileMtime: true, previewPath: true },
  });
  const dbMap = new Map(dbMedia.map((m) => [m.path, m]));

  const currentFolderMeta = await prisma.folderMeta.findUnique({
    where: { path: dirPath },
    select: { previewPath: true },
  });

  const toInsert: MediaCreateItem[] = [];
  const toUpdate: MediaUpdateItem[] = [];

  // --- 3. 各ファイルのメタデータ準備 & 比較 ---
  for (const f of mediaOnly) {
    const dbMeta = dbMap.get(f.path);
    const baseName = getFilenameWithoutExt(f.path);

    // A. 既にDBにプレビュー設定があるならそれを維持。なければ計算。
    let previewPath: string | null = dbMeta?.previewPath ?? null;

    if (previewPath === null) {
      if (f.type === "audio") {
        previewPath = imageMap.get(baseName) ?? firstMedia?.path ?? null;
      } else if (f.type === "video") {
        previewPath = imageMap.get(baseName) ?? null;
      }
    }

    if (!dbMeta) {
      // 新規挿入
      toInsert.push({
        path: f.path,
        dirPath,
        fileMtime: f.mtime,
        fileSize: f.size ? BigInt(f.size) : null,
        previewPath: previewPath,
        type: f.type as MediaType,
      });
    } else {
      // 更新判定
      const timeChanged = dbMeta.fileMtime.getTime() !== f.mtime.getTime();
      // DBがnullかつ、計算結果がある場合のみpreviewPathを更新対象にする
      const shouldAutoSetPreview =
        dbMeta.previewPath === null && previewPath !== null;

      if (timeChanged || shouldAutoSetPreview) {
        toUpdate.push({
          path: f.path,
          fileMtime: f.mtime,
          fileSize: f.size ? BigInt(f.size) : null,
          previewPath: shouldAutoSetPreview ? previewPath : dbMeta.previewPath,
          type: f.type as MediaType,
        });
      }
    }
  }

  const fsPaths = new Set(mediaOnly.map((f) => f.path));
  const toDelete = dbMedia
    .filter((m) => !fsPaths.has(m.path))
    .map((m) => m.path);

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
          fileMtime: u.fileMtime,
          fileSize: u.fileSize,
          previewPath: u.previewPath,
        },
      });
    }

    // FolderMeta の自動設定（null の場合のみ）
    if (!currentFolderMeta || currentFolderMeta.previewPath === null) {
      const folderPreview = firstMedia?.path ?? null;
      if (folderPreview) {
        await tx.folderMeta.upsert({
          where: { path: dirPath },
          update: { previewPath: folderPreview },
          create: { path: dirPath, previewPath: folderPreview },
        });
      }
    }
  });
}
