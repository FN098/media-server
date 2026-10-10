import { File } from "@/generated/prisma/client";
import { FsNode } from "@/lib/node/fs-listing";
import { isMedia } from "@/lib/node/media-types";
import { sortNodes } from "@/lib/node/sort";
import { FileType } from "@/lib/node/types";
import { db } from "@/lib/prisma";

type FileCreateItem = Pick<
  File,
  "id" | "folderId" | "previewFileId" | "name" | "mtime" | "size" | "type"
>;

type FileUpdateItem = Pick<
  File,
  "id" | "previewFileId" | "mtime" | "size" | "type"
>;

export async function syncFsWithDb(folderId: string, nodes: FsNode[]) {
  let mediaOnly = nodes.filter((n) => isMedia(n.fileType));

  // プレビュー候補は名前順で先頭に近いものを優先する
  mediaOnly = sortNodes(mediaOnly, {
    key: "name",
    direction: "asc",
  });

  // プレビュー候補の抽出
  const firstMedia = mediaOnly.find(
    (f) => f.fileType === "image" || f.fileType === "video"
  );

  // ファイル名（拡張子抜き）からファイル名へのマップ作成
  const imageMap = new Map<string, string>();
  mediaOnly.forEach((f) => {
    if (f.fileType === "image") {
      const baseName = f.name.replace(/\.[^/.]+$/, "");
      if (!imageMap.has(baseName)) {
        imageMap.set(baseName, f.path);
      }
    }
  });

  const dbFiles = await db.file.findMany({
    where: { folderId },
    select: {
      id: true,
      name: true,
      mtime: true,
      size: true,
      previewFileId: true,
      type: true,
    },
  });

  // ファイル名（拡張子抜き）からDBファイルへのマップ作成
  const dbMap = new Map(dbFiles.map((f) => [f.name, f]));

  // 名前からプレビュー用のファイルIDを引けるようにするため、全ファイルの (name -> id) マップも用意
  // 新規作成分も含めて事前にUUIDを割り当てる
  const fileNodesWithId = mediaOnly.map((f) => {
    const existing = dbMap.get(f.name);
    return {
      ...f,
      id: existing?.id ?? crypto.randomUUID(),
    };
  });

  const fileIdMap = new Map(fileNodesWithId.map((f) => [f.name, f.id]));

  const toCreate: FileCreateItem[] = [];
  const toUpdate: FileUpdateItem[] = [];

  // 各ファイルのメタデータ準備 & 比較
  for (const f of fileNodesWithId) {
    const dbMeta = dbMap.get(f.name);
    const baseName = f.name.replace(/\.[^/.]+$/, "");

    // プレビューファイル名の決定（動画、音楽）
    let previewFileName: string | null = null;
    if (f.fileType === "audio") {
      previewFileName = imageMap.get(baseName) ?? firstMedia?.name ?? null;
    } else if (f.fileType === "video") {
      previewFileName = imageMap.get(baseName) ?? null;
    }

    const previewFileId = previewFileName
      ? (fileIdMap.get(previewFileName) ?? null)
      : null;

    if (!dbMeta) {
      // 新規挿入
      toCreate.push({
        id: f.id,
        folderId,
        name: f.name,
        mtime: f.mtime,
        size: BigInt(f.size ?? 0),
        type: f.fileType as FileType,
        previewFileId: previewFileId,
      });
    } else {
      // 更新判定
      const timeChanged = dbMeta.mtime.getTime() !== f.mtime.getTime();
      const shouldAutoSetPreview =
        dbMeta.previewFileId === null && previewFileId !== null;

      if (timeChanged || shouldAutoSetPreview) {
        toUpdate.push({
          id: dbMeta.id,
          mtime: f.mtime,
          size: BigInt(f.size ?? 0),
          previewFileId: shouldAutoSetPreview
            ? previewFileId
            : dbMeta.previewFileId,
          type: f.fileType,
        });
      }
    }

    // 削除対象の抽出
    const fsNames = new Set(mediaOnly.map((f) => f.name));
    const toDeleteIds = dbFiles
      .filter((m) => !fsNames.has(m.name))
      .map((m) => m.id);

    // トランザクション実行
    await db.$transaction(async (tx) => {
      // 削除
      if (toDeleteIds.length > 0) {
        await tx.file.deleteMany({ where: { id: { in: toDeleteIds } } });
      }
      // 新規作成
      if (toCreate.length > 0) {
        await tx.file.createMany({ data: toCreate, skipDuplicates: true });
      }
      // 更新（個別のupdateだが、件数が多い場合はループか、またはケースバイケースで調整）
      for (const u of toUpdate) {
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

      // フォルダ自体のプレビュー設定（未設定の場合のみ先頭のメディアを自動設定）
      const folder = await tx.folder.findUnique({
        where: { id: folderId },
        select: { previewFileId: true },
      });

      if (folder && folder.previewFileId === null && firstMedia) {
        const folderPreviewId = fileIdMap.get(firstMedia.name);
        if (folderPreviewId) {
          await tx.folder.update({
            where: { id: folderId },
            data: { previewFileId: folderPreviewId },
          });
        }
      }
    });
  }
}
