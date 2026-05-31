import { prisma } from "@/lib/prisma";

// ==========================================
// renameNode
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
  await prisma.$transaction(async (tx) => {
    // -------------------------------------------------------
    // Media: 自分自身の path 更新（ファイル・フォルダ共通）
    // -------------------------------------------------------
    await tx.media.updateMany({
      where: { path: srcVirtualPath },
      data: { path: destVirtualPath },
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
    // VisitedFolder: リネーム先と被る既存レコードを削除
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

    // VisitedFolder: path 一括置換
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
    // FolderMeta: 配下の previewPath 一括置換（フォルダのみ）
    // -------------------------------------------------------
    if (isDirectory) {
      // リネーム先と被る既存レコードを削除（上書き許容）
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
