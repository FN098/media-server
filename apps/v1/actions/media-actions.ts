"use server";

import { renameSchema } from "@/lib/media/validation";
import {
  getServerMediaPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils/error";
import { existsPath } from "@/lib/utils/fs";
import { lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename, dirname, join } from "path";

export async function renameNodeAction(sourcePath: string, newName: string) {
  const result = renameSchema.safeParse({ newName });

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

    // NOTE: サムネイルは再作成すればいいので更新しない

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

  revalidatePath("/explorer");
  return {
    success: true,
  };
}

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

      const stats = await lstat(newRealPath);
      const isDirectory = stats.isDirectory();

      // DB更新
      await prisma.$transaction(async (tx) => {
        // 自分自身の更新
        await tx.$executeRaw`
          UPDATE Media SET 
            path = ${newVirtualPath}, 
            dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")}
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

        // 訪問履歴の削除
        await tx.$executeRaw`
          DELETE FROM VisitedFolder 
          WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
        `;
      });

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
    if (await existsPath(dest)) {
      await rm(dest, { force: true });
    }
    await rename(src, dest);
  } else {
    // ディレクトリの場合
    if (!(await existsPath(dest))) {
      await mkdir(dest, { recursive: true });
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

export async function deleteNodesPermanentlyAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const virtualPath of sourcePaths) {
    try {
      const realPath = getServerMediaTrashPath(virtualPath);

      // 存在確認
      if (!(await existsPath(realPath))) {
        throw new Error(`削除対象の項目が存在しません: ${basename(realPath)}`);
      }

      const stats = await lstat(realPath);
      const isDirectory = stats.isDirectory();

      // DB削除
      await prisma.$transaction(async (tx) => {
        if (isDirectory) {
          // フォルダ配下の子要素をすべて削除
          await tx.$executeRaw`
            DELETE FROM Media 
            WHERE path LIKE CONCAT(${virtualPath}, '/%')
          `;
        }

        // 自分自身のレコードを削除
        await tx.$executeRaw`
          DELETE FROM Media WHERE path = ${virtualPath}
        `;

        // 訪問履歴からも完全に削除
        await tx.$executeRaw`
          DELETE FROM VisitedFolder 
          WHERE dirPath = ${virtualPath} OR dirPath LIKE CONCAT(${virtualPath}, '/%')
        `;
      });

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

export async function restoreNodesAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  const trashRoot = PATHS.virtual.trash.root;

  for (const oldVirtualPath of sourcePaths) {
    try {
      const newVirtualPath = oldVirtualPath.startsWith(trashRoot)
        ? oldVirtualPath.replace(trashRoot, "")
        : oldVirtualPath;

      const oldRealPath = getServerMediaTrashPath(oldVirtualPath);
      const newRealPath = getServerMediaPath(newVirtualPath);

      // FS更新
      await mkdir(dirname(newRealPath), { recursive: true });
      await recursiveMergeMove(oldRealPath, newRealPath);

      const stats = await lstat(newRealPath);
      const isDirectory = stats.isDirectory();

      // DB更新
      await prisma.$transaction(async (tx) => {
        // 自分自身の更新
        await tx.$executeRaw`
          UPDATE Media SET 
            path = ${newVirtualPath}, 
            dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")}
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
      });

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
