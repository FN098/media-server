"use server";

import {
  GhostMediaDeleteResult,
  GhostMediaItem,
  GhostMediaScanOptions,
} from "@/lib/media/types";
import { fsNameSchema } from "@/lib/media/validation";
import {
  getServerMediaPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { deleteThumb } from "@/lib/thumb/delete";
import { getErrorMessage } from "@/lib/utils/error";
import { existsPath } from "@/lib/utils/fs";
import { constants } from "fs";
import { access, lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename, dirname, join } from "path";

// リネーム
export async function renameNodeAction(sourcePath: string, newName: string) {
  const result = fsNameSchema.safeParse(newName);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  try {
    const oldVirtualPath = sourcePath;
    const newVirtualPath =
      oldVirtualPath === "/"
        ? `/${newName.trim()}`
        : join(dirname(oldVirtualPath), newName.trim()).replace(/\\/g, "/");

    const oldRealPath = getServerMediaPath(oldVirtualPath);
    const newRealPath = getServerMediaPath(newVirtualPath);

    // 存在確認
    if (await existsPath(newRealPath)) {
      throw new Error(
        `同名のファイルまたはフォルダが既に存在します。: ${basename(newRealPath)}`
      );
    }

    // FS更新
    await rename(oldRealPath, newRealPath);

    // サムネイル削除
    await deleteThumb(oldVirtualPath);
    await deleteThumb(newVirtualPath);

    const stats = await lstat(newRealPath);
    const isDirectory = stats.isDirectory();

    // DB更新
    await prisma.$transaction(async (tx) => {
      // 自分自身の更新
      await tx.$executeRaw`
        UPDATE Media 
        SET path = ${newVirtualPath},
            dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")},
            title = ${newName}
        WHERE path = ${oldVirtualPath}
      `;

      if (isDirectory) {
        // 配下の更新
        await tx.$executeRaw`
          UPDATE Media 
          SET 
            path = REPLACE(path, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/')),
            dirPath = CASE 
              WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
              ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
            END
          WHERE path LIKE CONCAT(${oldVirtualPath}, '/%')
        `;
      }

      // 訪問履歴の更新
      await tx.$executeRaw`
        UPDATE VisitedFolder 
        SET dirPath = CASE 
          WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
          ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
        END
        WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
      `;
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
  targetDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const oldVirtualPath of sourcePaths) {
    try {
      const newName = oldVirtualPath.split("/").pop() || "";
      const newVirtualPath =
        targetDirPath === "/"
          ? `/${newName}`
          : `${targetDirPath}/${newName}`.replace(/\/+/g, "/");

      const oldRealPath = getServerMediaPath(oldVirtualPath);
      const newRealPath = getServerMediaPath(newVirtualPath);

      // 存在確認
      if (await existsPath(newRealPath)) {
        throw new Error(
          `移動先に同名の項目が存在します: ${basename(newRealPath)}`
        );
      }

      // FS更新
      await rename(oldRealPath, newRealPath);

      // NOTE: サムネイルは再作成すればいいので更新しない

      const stats = await lstat(newRealPath);
      const isDirectory = stats.isDirectory();

      // DB更新
      await prisma.$transaction(async (tx) => {
        // 自分自身の更新
        await tx.$executeRaw`
          UPDATE Media SET 
            path = ${newVirtualPath}, 
            dirPath = ${targetDirPath} 
          WHERE path = ${oldVirtualPath}
        `;

        if (isDirectory) {
          // 配下の更新
          await tx.$executeRaw`
            UPDATE Media SET 
              path = REPLACE(path, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/')),
              dirPath = CASE 
                WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
                ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
              END
            WHERE path LIKE CONCAT(${oldVirtualPath}, '/%')
          `;
        }

        // 訪問履歴の更新
        await tx.$executeRaw`
          UPDATE VisitedFolder 
          SET dirPath = CASE 
            WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
            ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
          END
          WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
        `;
      });

      results.success++;
    } catch (error) {
      console.error(`Move Error [${oldVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  revalidatePath("/explorer");
  return results;
}

// フォルダ一覧
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

// 削除
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

  revalidatePath("/explorer");
  revalidatePath("/trash");
  return results;
}

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
    if (!(await existsPath(dest))) {
      await rename(src, dest);
      return;
    }

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

// 復元
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
 * スキャン（ゴーストデータ）
 * フォルダ単位の高速スキャンと、ファイル単位のフルスキャンをサポート
 */
export async function scanGhostMediaAction(options?: GhostMediaScanOptions) {
  try {
    const isFullScan = options?.fullScan ?? false;
    const ghostItems: GhostMediaItem[] = [];

    if (isFullScan) {
      // 1. 全レコードを取得して一つずつ実体を確認
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
      // 2. フォルダ単位の高速チェック
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

/**
 * 削除実行（ゴーストデータ）
 * フロントエンドから送られてきたIDリストに基づいて一括削除
 */
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
