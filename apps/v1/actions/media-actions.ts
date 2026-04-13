"use server";

import {
  GhostMediaDeleteResult,
  GhostMediaItem,
  GhostMediaScanOptions,
} from "@/lib/media/types";
import { fsNameSchema } from "@/lib/media/validation";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils/error";
import { existsPath } from "@/lib/utils/fs";
import { constants } from "fs";
import { access, cp, lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename, dirname, join } from "path";

// リネーム
export async function renameNodeAction(sourcePath: string, newName: string) {
  const validation = fsNameSchema.safeParse(newName);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  try {
    const srcVirtualPath = sourcePath;
    const destVirtualPath =
      srcVirtualPath === "/"
        ? `/${newName.trim()}`
        : join(dirname(srcVirtualPath), newName.trim()).replace(/\\/g, "/");

    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);

    // 存在確認
    if (await existsPath(destRealPath)) {
      throw new Error(
        `同名の項目が既に存在します。: ${basename(destRealPath)}`
      );
    }

    const stats = await lstat(srcRealPath);
    const isDirectory = stats.isDirectory();

    // サムネイルリネーム（本体リネーム前に実行しないと、サムネイル作成コマンドが走ってしまいロックされてエラーになる）
    try {
      const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
      const destThumbPath = getServerMediaThumbPath(
        destVirtualPath,
        isDirectory
      );
      await rename(srcThumbPath, destThumbPath);
    } catch (e) {
      console.error("rename thumbnail error:", e);
    }

    // FS更新
    await rename(srcRealPath, destRealPath);

    // DB更新
    await prisma.$transaction(async (tx) => {
      // 自分自身の更新
      await tx.$executeRaw`
        UPDATE Media 
        SET path = ${destVirtualPath},
            dirPath = ${dirname(destVirtualPath).replace(/\\/g, "/")},
            title = ${newName}
        WHERE path = ${srcVirtualPath}
      `;

      // 配下の更新
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
      }

      // 訪問履歴の更新
      await tx.$executeRaw`
        UPDATE VisitedFolder 
        SET dirPath = CASE 
          WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
          ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
        END
        WHERE dirPath = ${srcVirtualPath} OR dirPath LIKE CONCAT(${srcVirtualPath}, '/%')
      `;

      // プレビューの更新
      if (isDirectory) {
        // 1. リネーム先に既に存在するレコードを削除 (上書きを許容するため)
        //    自分自身だけでなく、配下のパスも重複する可能性があるため一括削除
        await tx.$executeRaw`
          DELETE FROM FolderMeta 
          WHERE path = ${destVirtualPath} OR path LIKE CONCAT(${destVirtualPath}, '/%')
        `;

        // 2. 既存レコードの path と previewPath を一括更新
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
          WHERE path = ${srcVirtualPath} OR path LIKE CONCAT(${srcVirtualPath}, '/%')
        `;
      } else {
        // ファイル単体のリネームの場合
        // 1. もしリネーム先にメタデータがあれば削除
        await tx.$executeRaw`DELETE FROM FolderMeta WHERE path = ${destVirtualPath}`;

        // 2. 自身のパス更新
        await tx.$executeRaw`
          UPDATE FolderMeta SET path = ${destVirtualPath} WHERE path = ${srcVirtualPath}
        `;

        // 3. 他のフォルダの previewPath として使われていた場合の更新
        await tx.$executeRaw`
          UPDATE FolderMeta SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
        `;
      }
    });
  } catch (error) {
    console.error("Rename Error:", error);
    return {
      success: false,
      error: "リネーム中にエラーが発生しました。権限などを確認してください。",
    };
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}

// 移動
export async function moveNodesAction(
  sourcePaths: string[],
  destDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of sourcePaths) {
    // 子孫チェック
    if (
      destDirPath === srcVirtualPath ||
      destDirPath.startsWith(srcVirtualPath + "/")
    ) {
      results.failed++;
      results.errors.push(
        `自分自身またはサブフォルダへの操作はできません: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    try {
      const srcName = srcVirtualPath.split("/").pop() || "";
      const destVirtualPath =
        destDirPath === "/"
          ? `/${srcName}`
          : `${destDirPath}/${srcName}`.replace(/\/+/g, "/");

      const srcRealPath = getServerMediaPath(srcVirtualPath);
      const destRealPath = getServerMediaPath(destVirtualPath);

      // 存在確認
      if (await existsPath(destRealPath)) {
        throw new Error(
          `移動先に同名の項目が存在します: ${basename(destRealPath)}`
        );
      }

      const stats = await lstat(srcRealPath);
      const isDirectory = stats.isDirectory();

      // サムネイルリネーム（本体リネーム前に実行しないと、サムネイル作成コマンドが走ってしまいロックされてエラーになる）
      try {
        const srcThumbPath = getServerMediaThumbPath(
          srcVirtualPath,
          isDirectory
        );
        const destThumbPath = getServerMediaThumbPath(
          destVirtualPath,
          isDirectory
        );
        await rename(srcThumbPath, destThumbPath);
      } catch (e) {
        console.error("rename thumbnail error:", e);
      }

      // FS更新
      await rename(srcRealPath, destRealPath);

      // DB更新
      await prisma.$transaction(async (tx) => {
        // 自分自身の更新
        await tx.$executeRaw`
          UPDATE Media SET 
            path = ${destVirtualPath}, 
            dirPath = ${destDirPath} 
          WHERE path = ${srcVirtualPath}
        `;

        // 配下の更新
        if (isDirectory) {
          await tx.$executeRaw`
            UPDATE Media SET 
              path = REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/')),
              dirPath = CASE 
                WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
                ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
              END
            WHERE path LIKE CONCAT(${srcVirtualPath}, '/%')
          `;
        }

        // 訪問履歴の更新
        await tx.$executeRaw`
          UPDATE VisitedFolder 
          SET dirPath = CASE 
            WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
            ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
          END
          WHERE dirPath = ${srcVirtualPath} OR dirPath LIKE CONCAT(${srcVirtualPath}, '/%')
        `;

        // プレビューの更新
        if (isDirectory) {
          // リネーム先の重複を削除（上書き許容）
          await tx.$executeRaw`
            DELETE FROM FolderMeta 
            WHERE path = ${destVirtualPath} OR path LIKE CONCAT(${destVirtualPath}, '/%')
          `;

          // path と previewPath を一括置換
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
            WHERE path = ${srcVirtualPath} OR path LIKE CONCAT(${srcVirtualPath}, '/%')
          `;
        } else {
          // ファイル単体の移動の場合
          await tx.$executeRaw`DELETE FROM FolderMeta WHERE path = ${destVirtualPath}`;

          await tx.$executeRaw`
            UPDATE FolderMeta SET path = ${destVirtualPath} WHERE path = ${srcVirtualPath}
          `;

          // 他のフォルダの表紙(previewPath)として使われていた場合、その参照も更新
          await tx.$executeRaw`
            UPDATE FolderMeta SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
          `;
        }
      });

      results.success++;
    } catch (error) {
      console.error(`Move Error [${srcVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return results;
}

// コピー
export async function copyNodesAction(
  sourcePaths: string[],
  destDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of sourcePaths) {
    // 子孫チェック
    if (
      destDirPath === srcVirtualPath ||
      destDirPath.startsWith(srcVirtualPath + "/")
    ) {
      results.failed++;
      results.errors.push(
        `自分自身またはサブフォルダへの操作はできません: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    try {
      const srcName = srcVirtualPath.split("/").pop() || "";
      const destVirtualPath =
        destDirPath === "/"
          ? `/${srcName}`
          : `${destDirPath}/${srcName}`.replace(/\/+/g, "/");

      const srcRealPath = getServerMediaPath(srcVirtualPath);
      const destRealPath = getServerMediaPath(destVirtualPath);

      // 存在確認
      if (await existsPath(destRealPath)) {
        throw new Error(
          `コピー先に同名の項目が存在します: ${basename(destRealPath)}`
        );
      }

      const stats = await lstat(srcRealPath);
      const isDirectory = stats.isDirectory();

      // FS コピー（ディレクトリは再帰的に）
      await cp(srcRealPath, destRealPath, { recursive: isDirectory });

      // サムネイルのコピー（失敗しても本体コピーは続行）
      try {
        const srcThumbPath = getServerMediaThumbPath(
          srcVirtualPath,
          isDirectory
        );
        const destThumbPath = getServerMediaThumbPath(
          destVirtualPath,
          isDirectory
        );
        await cp(srcThumbPath, destThumbPath, { recursive: isDirectory });
      } catch (e) {
        console.error("copy thumbnail error:", e);
      }

      // NOTE: DB 登録はしない（新規として扱う）

      results.success++;
    } catch (error) {
      console.error(`Copy Error [${srcVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return results;
}

// サブフォルダ一覧
export async function getSubDirectoriesAction(dirPath: string) {
  try {
    const realPath = getServerMediaPath(dirPath);
    const entries = await readdir(realPath, { withFileTypes: true });

    return {
      success: true,
      directories: entries
        .filter((e) => e.isDirectory())
        .map((e) => ({
          name: e.name,
          path: join(dirPath, e.name).replace(/\\/g, "/"),
        })),
    };
  } catch (error) {
    console.error(`Sub Directories Error [${dirPath}]:`, error);
    return { success: false, error: "フォルダ一覧の取得に失敗しました" };
  }
}

// 再帰的な移動
async function recursiveMergeMove(src: string, dest: string) {
  const stats = await lstat(src);
  if (!stats.isDirectory()) {
    // ファイルの場合
    // 移動先に同名ファイルがあれば上書き
    if (await existsPath(dest)) {
      await rm(dest, { force: true });
    }
    await rename(src, dest);
  } else {
    // ディレクトリの場合
    // 移動先に同名フォルダがなければリネーム
    if (!(await existsPath(dest))) {
      await rename(src, dest);
      return;
    }

    // 同名フォルダがあれば中のファイルやフォルダを再帰的に移動
    const entries = await readdir(src);
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      await recursiveMergeMove(srcPath, destPath);
    }

    // 空になったソースディレクトリを削除
    await rm(src, { recursive: true, force: true });
  }
}

// 削除（ゴミ箱フォルダへの移動）
export async function deleteNodesAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const oldVirtualPath of sourcePaths) {
    try {
      const newVirtualPath = oldVirtualPath;

      const oldRealPath = getServerMediaPath(oldVirtualPath);
      const newRealPath = getServerMediaTrashPath(newVirtualPath);

      // FS更新
      await mkdir(dirname(newRealPath), { recursive: true });
      await recursiveMergeMove(oldRealPath, newRealPath);

      results.success++;
    } catch (error) {
      console.error(`Delete Error [${oldVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  // キャッシュの更新
  revalidatePath("/explorer");
  revalidatePath("/trash");

  return results;
}

// 完全に削除
export async function deleteNodesPermanentlyAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const virtualPath of sourcePaths) {
    try {
      const realPath = getServerMediaTrashPath(virtualPath);

      // 存在確認
      if (!(await existsPath(realPath))) {
        throw new Error(`削除対象の項目が存在しません: ${basename(realPath)}`);
      }

      // FS削除
      await rm(realPath, { recursive: true, force: true });

      results.success++;
    } catch (error) {
      console.error(`Permanent Delete Error [${virtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  revalidatePath("/trash");
  return results;
}

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreNodesAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const oldVirtualPath of sourcePaths) {
    try {
      const newVirtualPath = oldVirtualPath;

      const oldRealPath = getServerMediaTrashPath(oldVirtualPath);
      const newRealPath = getServerMediaPath(newVirtualPath);

      // FS更新
      await mkdir(dirname(newRealPath), { recursive: true });
      await recursiveMergeMove(oldRealPath, newRealPath);

      results.success++;
    } catch (error) {
      console.error(`Restore Error [${oldVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  revalidatePath("/explorer");
  revalidatePath("/trash");
  return results;
}

/**
 * 不要なメディアをスキャン
 * @deprecated 進捗確認できないので非推奨。代わりに /api/ghost/media/scan を推奨
 */
export async function scanGhostMediaAction(options?: GhostMediaScanOptions) {
  try {
    const isFullScan = options?.fullScan ?? false;
    const ghostItems: GhostMediaItem[] = [];

    if (isFullScan) {
      // フルスキャン：ファイル単位で実体を確認
      const allMedia = await prisma.media.findMany({
        select: { id: true, title: true, path: true, dirPath: true },
      });

      for (const item of allMedia) {
        const realPath = getServerMediaPath(item.path);
        try {
          await access(realPath, constants.F_OK);
        } catch {
          ghostItems.push({
            id: item.id,
            title: item.title,
            path: item.path,
          });
        }
      }
    } else {
      // クイックスキャン：フォルダ単位で実体を確認
      const folders = await prisma.media.groupBy({
        by: ["dirPath"],
      });

      const missingDirPaths: string[] = [];
      for (const folder of folders) {
        const realPath = getServerMediaPath(folder.dirPath);
        try {
          await access(realPath, constants.F_OK);
        } catch {
          missingDirPaths.push(folder.dirPath);
        }
      }

      if (missingDirPaths.length > 0) {
        const items = await prisma.media.findMany({
          where: { dirPath: { in: missingDirPaths } },
          select: { id: true, title: true, path: true },
        });
        ghostItems.push(...items);
      }
    }

    return {
      success: true,
      items: ghostItems,
    };
  } catch (error) {
    console.error("Scan Ghost Media Error:", error);
    return { success: false, error: "スキャン中にエラーが発生しました。" };
  }
}

// 不要なメディアを削除
export async function cleanupGhostMediaAction(
  ids: string[]
): Promise<GhostMediaDeleteResult> {
  try {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const deleteResult = await prisma.media.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    console.error("Cleanup Ghost Media Error:", error);
    return {
      success: false,
      error: "削除中に予期せぬエラーが発生しました。",
    };
  }
}
