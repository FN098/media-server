import { Favorite, Media, MediaTag } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dirname } from "@/lib/virtual-path/path";
import { randomUUID } from "crypto";

// ==========================================
// renameNode
// rename / move 共通。FSのrename()と同じ概念で
// 「srcVirtualPath → destVirtualPath にパスを付け替える」操作。
// rename の場合は dirPath が実質変わらないが同じクエリで問題なし。
// ==========================================

interface RenameNodeInDbParams {
  srcVirtualPath: string;
  destVirtualPath: string;
  isDirectory: boolean;
}

export async function renameNodeInDb({
  srcVirtualPath,
  destVirtualPath,
  isDirectory,
}: RenameNodeInDbParams): Promise<void> {
  const destDirPath = dirname(destVirtualPath);

  await prisma.$transaction(async (tx) => {
    // -------------------------------------------------------
    // Media: 自分自身の path / dirPath 更新（ファイル・フォルダ共通）
    // rename の場合は dirPath が変わらないが、同じクエリで問題なし
    // -------------------------------------------------------
    await tx.media.updateMany({
      where: { path: srcVirtualPath },
      data: { path: destVirtualPath, dirPath: destDirPath },
    });

    // -------------------------------------------------------
    // Media: 配下の path / dirPath / previewPath 一括置換（フォルダのみ）
    // -------------------------------------------------------
    if (isDirectory) {
      await tx.$executeRaw`
        UPDATE Media
        SET
          path = REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/')),
          dirPath = CASE
            WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
            ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
          END
        WHERE path LIKE CONCAT(${srcVirtualPath}, '/%')
      `;

      await tx.$executeRaw`
        UPDATE Media
        SET previewPath = CASE
          WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
          WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
            THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
          ELSE previewPath
        END
        WHERE previewPath = ${srcVirtualPath}
          OR previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
      `;
    } else {
      // ファイル単体: previewPath の参照を更新
      await tx.media.updateMany({
        where: { previewPath: srcVirtualPath },
        data: { previewPath: destVirtualPath },
      });
    }

    // -------------------------------------------------------
    // VisitedFolder: 移動先と被る既存レコードを削除
    // -------------------------------------------------------
    await tx.visitedFolder.deleteMany({
      where: {
        AND: [
          {
            OR: [
              { dirPath: destVirtualPath },
              { dirPath: { startsWith: `${destVirtualPath}/` } },
            ],
          },
          {
            NOT: {
              OR: [
                { dirPath: srcVirtualPath },
                { dirPath: { startsWith: `${srcVirtualPath}/` } },
              ],
            },
          },
        ],
      },
    });

    // VisitedFolder: dirPath 一括置換
    await tx.$executeRaw`
      UPDATE VisitedFolder
      SET dirPath = CASE
        WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
        ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
      END
      WHERE dirPath = ${srcVirtualPath}
        OR dirPath LIKE CONCAT(${srcVirtualPath}, '/%')
    `;

    // -------------------------------------------------------
    // FolderMeta（フォルダのみ）
    // -------------------------------------------------------
    if (isDirectory) {
      // 移動先と被る既存レコードを削除（上書き許容）
      await tx.folderMeta.deleteMany({
        where: {
          OR: [
            { path: destVirtualPath },
            { path: { startsWith: `${destVirtualPath}/` } },
          ],
        },
      });

      // path / previewPath 一括置換
      await tx.$executeRaw`
        UPDATE FolderMeta
        SET
          path = CASE
            WHEN path = ${srcVirtualPath} THEN ${destVirtualPath}
            ELSE REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
          END,
          previewPath = CASE
            WHEN previewPath IS NULL THEN NULL
            WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
            WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
              THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
            ELSE previewPath
          END
        WHERE path = ${srcVirtualPath}
          OR path LIKE CONCAT(${srcVirtualPath}, '/%')
      `;
    } else {
      // ファイル単体: FolderMeta の previewPath 参照を更新
      await tx.folderMeta.updateMany({
        where: { previewPath: srcVirtualPath },
        data: { previewPath: destVirtualPath },
      });
    }
  });
}

// ==========================================
// copyNode
// FSのcp()に対応するDB操作。
// src配下のMedia/MediaTag/Favoriteレコードを dest 配下に新規作成する。
// VisitedFolder / FolderMeta はコピーしない（コピー先は未訪問・メタなし扱い）。
// ==========================================

interface CopyNodeInDbParams {
  srcVirtualPath: string;
  destVirtualPath: string;
  isDirectory: boolean;
  userId: string;
}

export async function copyNodeInDb({
  srcVirtualPath,
  destVirtualPath,
  isDirectory,
  userId,
}: CopyNodeInDbParams): Promise<void> {
  const destDirPath = dirname(destVirtualPath);

  await prisma.$transaction(async (tx) => {
    // コピー元の Media を一括取得（ファイル単体 or フォルダ配下全て）
    const srcMediaList = await tx.media.findMany({
      where: isDirectory
        ? {
            OR: [
              { dirPath: srcVirtualPath },
              { dirPath: { startsWith: `${srcVirtualPath}/` } },
            ],
          }
        : { path: srcVirtualPath },
      include: {
        mediaTags: { select: { tagId: true } },
        favorites: { select: { rating: true }, where: { userId } },
      },
    });

    const replacePath = (p: string) =>
      destVirtualPath + p.slice(srcVirtualPath.length);

    // src → dest の ID マッピングを生成しつつ挿入データを構築
    const idMap = new Map<string, string>();

    const mediaData = srcMediaList.map((m) => {
      const newId = randomUUID();
      idMap.set(m.id, newId);

      if (!isDirectory) {
        return {
          id: newId,
          path: destVirtualPath,
          dirPath: destDirPath,
          fileMtime: m.fileMtime,
          fileSize: m.fileSize,
          type: m.type,
          title: m.title,
          previewPath: m.previewPath,
        };
      } else {
        return {
          id: newId,
          path: replacePath(m.path),
          dirPath: replacePath(m.dirPath),
          fileMtime: m.fileMtime,
          fileSize: m.fileSize,
          type: m.type,
          title: m.title,
          previewPath: m.previewPath?.startsWith(srcVirtualPath)
            ? replacePath(m.previewPath)
            : (m.previewPath ?? null),
        };
      }
    }) satisfies Partial<Media>[];

    const mediaTagData = srcMediaList.flatMap((m) =>
      m.mediaTags.map(
        ({ tagId }) =>
          ({
            mediaId: idMap.get(m.id)!,
            tagId,
          }) satisfies Partial<MediaTag>
      )
    );

    const favoriteData = srcMediaList.flatMap((m) =>
      m.favorites.map(
        ({ rating }) =>
          ({
            mediaId: idMap.get(m.id)!,
            userId,
            rating,
          }) satisfies Partial<Favorite>
      )
    );

    await tx.media.createMany({ data: mediaData, skipDuplicates: true });
    await tx.mediaTag.createMany({ data: mediaTagData, skipDuplicates: true });
    await tx.favorite.createMany({ data: favoriteData, skipDuplicates: true });
  });
}
