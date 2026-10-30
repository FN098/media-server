import { File, Folder } from "@/generated/prisma/client";
import { isMediaFile } from "@/lib/file/media-types";
import { FileType, FsNode } from "@/lib/fs/fs-listing";
import { db } from "@/lib/prisma";
import { sortNodes } from "@/lib/sort/sort-nodes";

type FileCreateItem = Pick<
  File,
  "id" | "parentFolderId" | "previewFileId" | "name" | "mtime" | "size" | "type"
>;

type FileUpdateItem = Pick<
  File,
  "id" | "previewFileId" | "mtime" | "size" | "type"
>;

type FolderCreateItem = Pick<
  Folder,
  "id" | "parentFolderId" | "name" | "mtime"
>;

type FolderUpdateItem = Pick<Folder, "id" | "mtime">;

export async function syncFsWithDb(parentFolderId: string, nodes: FsNode[]) {
  // 1. ディレクトリとファイルを分離
  const dirNodes = nodes.filter((n) => n.isDirectory);
  const fileNodes = nodes.filter((n) => !n.isDirectory);

  // ==========================================
  // 2. フォルダの同期準備
  // ==========================================
  const dbFolders = await db.folder.findMany({
    where: { parentFolderId },
    select: { id: true, name: true, mtime: true },
  });
  const dbFolderMap = new Map(dbFolders.map((f) => [f.name, f]));

  const sortedDirs = sortNodes(dirNodes, { key: "name", direction: "asc" });
  const dirNodesWithId = sortedDirs.map((d) => {
    const existing = dbFolderMap.get(d.name);
    return {
      ...d,
      id: existing?.id ?? crypto.randomUUID(),
    };
  });

  const toCreateFolders: FolderCreateItem[] = [];
  const toUpdateFolders: FolderUpdateItem[] = [];
  const fsFolderNames = new Set(dirNodes.map((d) => d.name));
  const toDeleteFolderIds = dbFolders
    .filter((d) => !fsFolderNames.has(d.name))
    .map((d) => d.id);

  for (const d of dirNodesWithId) {
    const dbMeta = dbFolderMap.get(d.name);
    if (!dbMeta) {
      toCreateFolders.push({
        id: d.id,
        parentFolderId,
        name: d.name,
        mtime: d.mtime,
      });
    } else {
      const timeChanged = dbMeta.mtime.getTime() !== d.mtime.getTime();
      if (timeChanged) {
        toUpdateFolders.push({
          id: dbMeta.id,
          mtime: d.mtime,
        });
      }
    }
  }

  // ==========================================
  // 3. ファイルの同期準備
  // ==========================================
  const sortedFiles = sortNodes(fileNodes, { key: "name", direction: "asc" });

  // プレビュー候補（画像・動画）の抽出
  const mediaOnly = fileNodes.filter(
    (n): n is Extract<FsNode, { isDirectory: false }> & { type: FileType } =>
      n.type !== null && isMediaFile(n.type)
  );
  const firstMedia = mediaOnly.find(
    (f) => f.type === "image" || f.type === "video"
  );

  // 同名画像マップの作成（音声・動画のプレビュー用）
  const imageMap = new Map<string, string>();
  mediaOnly.forEach((f) => {
    if (f.type === "image") {
      const baseName = f.name.replace(/\.[^/.]+$/, "");
      if (!imageMap.has(baseName)) {
        imageMap.set(baseName, f.name);
      }
    }
  });

  const dbFiles = await db.file.findMany({
    where: { parentFolderId },
    select: {
      id: true,
      name: true,
      mtime: true,
      size: true,
      previewFileId: true,
      type: true,
    },
  });
  const dbFileMap = new Map(dbFiles.map((f) => [f.name, f]));

  const fileNodesWithId = sortedFiles.map((f) => {
    const existing = dbFileMap.get(f.name);
    return {
      ...f,
      id: existing?.id ?? crypto.randomUUID(),
    };
  });

  const fileIdMap = new Map(fileNodesWithId.map((f) => [f.name, f.id]));

  const toCreateFiles: FileCreateItem[] = [];
  const toUpdateFiles: FileUpdateItem[] = [];
  const fsFileNames = new Set(fileNodes.map((f) => f.name));
  const toDeleteFileIds = dbFiles
    .filter((m) => !fsFileNames.has(m.name))
    .map((m) => m.id);

  for (const f of fileNodesWithId) {
    const dbMeta = dbFileMap.get(f.name);
    const baseName = f.name.replace(/\.[^/.]+$/, "");

    // プレビューファイル名の決定
    let previewFileName: string | null = null;
    if (f.type === "audio") {
      previewFileName = imageMap.get(baseName) ?? firstMedia?.name ?? null;
    } else if (f.type === "video") {
      previewFileName = imageMap.get(baseName) ?? null;
    }

    const previewFileId = previewFileName
      ? (fileIdMap.get(previewFileName) ?? null)
      : null;

    const fileType = f.type ?? "binary";

    if (!dbMeta) {
      toCreateFiles.push({
        id: f.id,
        parentFolderId,
        name: f.name,
        mtime: f.mtime,
        size: BigInt(f.size ?? 0),
        type: fileType,
        previewFileId,
      });
    } else {
      const timeChanged = dbMeta.mtime.getTime() !== f.mtime.getTime();
      const sizeChanged = dbMeta.size !== BigInt(f.size ?? 0);
      const shouldAutoSetPreview =
        dbMeta.previewFileId === null && previewFileId !== null;

      if (timeChanged || sizeChanged || shouldAutoSetPreview) {
        toUpdateFiles.push({
          id: dbMeta.id,
          mtime: f.mtime,
          size: BigInt(f.size ?? 0),
          previewFileId: shouldAutoSetPreview
            ? previewFileId
            : dbMeta.previewFileId,
          type: fileType,
        });
      }
    }
  }

  // ==========================================
  // 4. トランザクション一括実行
  // ==========================================
  await db.$transaction(async (tx) => {
    // --- フォルダの変更適用 ---
    if (toDeleteFolderIds.length > 0) {
      await tx.folder.deleteMany({ where: { id: { in: toDeleteFolderIds } } });
    }
    if (toCreateFolders.length > 0) {
      await tx.folder.createMany({
        data: toCreateFolders,
        skipDuplicates: true,
      });
    }
    for (const u of toUpdateFolders) {
      await tx.folder.update({
        where: { id: u.id },
        data: { mtime: u.mtime },
      });
    }

    // --- ファイルの変更適用 ---
    if (toDeleteFileIds.length > 0) {
      await tx.file.deleteMany({ where: { id: { in: toDeleteFileIds } } });
    }
    if (toCreateFiles.length > 0) {
      await tx.file.createMany({ data: toCreateFiles, skipDuplicates: true });
    }
    for (const u of toUpdateFiles) {
      await tx.file.update({
        where: { id: u.id },
        data: {
          mtime: u.mtime,
          size: u.size,
          previewFileId: u.previewFileId,
          type: u.type,
        },
      });
    }

    // --- 親フォルダ自体のプレビュー設定（未設定の場合のみ） ---
    const folder = await tx.folder.findUnique({
      where: { id: parentFolderId },
      select: { previewFileId: true },
    });

    if (folder && folder.previewFileId === null && firstMedia) {
      const folderPreviewId = fileIdMap.get(firstMedia.name);
      if (folderPreviewId) {
        await tx.folder.update({
          where: { id: parentFolderId },
          data: { previewFileId: folderPreviewId },
        });
      }
    }
  });
}
