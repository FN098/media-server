"use server";

import { renameSchema } from "@/lib/media/validation";
import { getMediaPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils/error";
import { existsPath } from "@/lib/utils/fs";
import { lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { dirname, join } from "path";

export async function renameNodeAction(sourcePath: string, newName: string) {
  const result = renameSchema.safeParse({ newName });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  try {
    // 仮想パス上での新パス（DB更新用）
    const oldVirtualPath = sourcePath;
    const newVirtualPath =
      oldVirtualPath === "/"
        ? `/${newName.trim()}`
        : join(dirname(oldVirtualPath), newName.trim()).replace(/\\/g, "/");

    const oldRealPath = getMediaPath(oldVirtualPath);
    const newRealPath = getMediaPath(newVirtualPath);

    // 同名パスの存在チェック
    if (await existsPath(newRealPath)) {
      return {
        success: false,
        error: "同名のファイルまたはフォルダが既に存在します。",
      };
    }

    // FS更新
    try {
      await rename(oldRealPath, newRealPath);
    } catch (fsError) {
      console.error("FS rename failed...", fsError);
      return {
        success: false,
        error: "ファイルシステムのリネームに失敗しました。",
      };
    }

    // NOTE: サムネイルは再作成すればいいので更新しない

    // DB更新
    try {
      const stats = await lstat(newRealPath);
      const isDirectory = stats.isDirectory();

      await prisma.$transaction(async (tx) => {
        // 自分自身のパス更新
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

          // 訪問履歴の更新
          await tx.$executeRaw`
            UPDATE VisitedFolder 
            SET dirPath = CASE 
              WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
              ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
            END
            WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
          `;
        } else {
          await tx.$executeRaw`
            UPDATE VisitedFolder SET dirPath = ${newVirtualPath} WHERE dirPath = ${oldVirtualPath}
          `;
        }
      });
    } catch (dbError) {
      // DB失敗時のFSロールバック
      console.error("DB update failed, rolling back FS rename...", dbError);

      try {
        await rename(newRealPath, oldRealPath);
      } catch (fsRollbackError) {
        // ここまで来ると致命的（FSも戻せなかった）なので、ログに最大級の警告を出す
        console.error(
          "CRITICAL: Failed to rollback FS rename!",
          fsRollbackError
        );
      }

      return {
        success: false,
        error: "データベースの更新に失敗したため、変更をキャンセルしました。",
      };
    }

    revalidatePath("/explorer");
    return {
      success: true,
      newPath: newVirtualPath,
    };
  } catch (error) {
    console.error("Rename Error:", error);
    return {
      success: false,
      error: "リネーム中にエラーが発生しました。権限などを確認してください。",
    };
  }
}

export async function moveNodesAction(
  sourcePaths: string[],
  targetDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const oldVirtualPath of sourcePaths) {
    try {
      const fileName = oldVirtualPath.split("/").pop() || "";
      const newVirtualPath =
        targetDirPath === "/"
          ? `/${fileName}`
          : `${targetDirPath}/${fileName}`.replace(/\/+/g, "/");

      const oldRealPath = getMediaPath(oldVirtualPath);
      const newRealPath = getMediaPath(newVirtualPath);

      // 同名パスの存在チェック
      if (await existsPath(newRealPath)) {
        throw new Error(`移動先に同名の項目が存在します: ${fileName}`);
      }

      // FS更新
      await rename(oldRealPath, newRealPath);

      // NOTE: サムネイルは再作成すればいいので更新しない

      // DB更新
      try {
        const stats = await lstat(newRealPath);
        const isDirectory = stats.isDirectory();

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

            // 訪問履歴の更新
            await tx.$executeRaw`
              UPDATE VisitedFolder 
              SET dirPath = CASE 
                WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
                ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
              END
              WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
            `;
          }
        });
        results.success++;
      } catch (dbError) {
        // DB失敗時のFSロールバック
        console.error("DB update failed, rolling back FS rename...", dbError);

        try {
          await rename(newRealPath, oldRealPath);
        } catch (fsRollbackError) {
          // ここまで来ると致命的（FSも戻せなかった）なので、ログに最大級の警告を出す
          console.error(
            "CRITICAL: Failed to rollback FS rename!",
            fsRollbackError
          );
        }

        throw new Error("データベースの更新に失敗しました。", {
          cause: dbError,
        });
      }
    } catch (error: unknown) {
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
    const realPath = getMediaPath(dirPath);
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
  const targetDirPath = PATHS.virtual.trash.root;

  for (const oldVirtualPath of sourcePaths) {
    try {
      const newVirtualPath = `${targetDirPath}/${oldVirtualPath}`.replace(
        /\/+/g,
        "/"
      );

      const oldRealPath = getMediaPath(oldVirtualPath);
      const newRealPath = getMediaPath(newVirtualPath);

      // 移動先の親ディレクトリを物理的に作成
      await mkdir(dirname(newRealPath), { recursive: true });

      // 再帰的に移動（ファイルなら上書き、フォルダならマージ）
      await recursiveMergeMove(oldRealPath, newRealPath);

      // DB更新
      try {
        const stats = await lstat(newRealPath);
        const isDirectory = stats.isDirectory();

        await prisma.$transaction(async (tx) => {
          // 自分自身の更新
          await tx.$executeRaw`
            UPDATE Media SET 
              path = ${newVirtualPath}, 
              dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")}
            WHERE path = ${oldVirtualPath}
          `;

          if (isDirectory) {
            // 配下の子要素をすべて置換（移動ロジックと同じ）
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

          // 訪問履歴からは削除（ゴミ箱の中身は履歴に出さない）
          await tx.$executeRaw`
            DELETE FROM VisitedFolder 
            WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
          `;
        });
        results.success++;
      } catch (dbError) {
        // DB失敗時はFSを元に戻す
        await rename(newRealPath, oldRealPath);
        throw dbError;
      }
    } catch (error) {
      console.error(`Delete Error [${oldVirtualPath}]:`, error);
      results.failed++;
      results.errors.push(getErrorMessage(error));
    }
  }

  revalidatePath("/explorer");
  return results;
}

async function recursiveMergeMove(src: string, dest: string) {
  const stats = await lstat(src);

  if (!stats.isDirectory()) {
    // ファイルの場合は単純に移動（上書き）
    // 移動先に同名ファイルがあれば先に消す（上書きのため）
    if (await existsPath(dest)) {
      await rm(dest, { force: true });
    }
    await rename(src, dest);
    return;
  }

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

  // 中身をすべて移動し終えたら、空になったソースディレクトリを削除
  await rm(src, { recursive: true, force: true });
}
