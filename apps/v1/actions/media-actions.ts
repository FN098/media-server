"use server";

import { renameSchema } from "@/lib/media/validation";
import { getMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { existsPath } from "@/lib/utils/fs";
import { lstat, rename } from "fs/promises";
import { revalidatePath } from "next/cache";
import { dirname, join } from "path";

/**
 * ファイルまたはフォルダのリネーム
 * @param oldVirtualPath 元のフルパス
 * @param newName 新しい名前（ファイル名・フォルダ名のみ）
 */
export async function renameNodeAction(
  oldVirtualPath: string,
  newName: string
) {
  const result = renameSchema.safeParse({ newName });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  try {
    // 親ディレクトリを取得し、新しいフルパスを構築
    const oldRealPath = getMediaPath(oldVirtualPath);
    const stats = await lstat(oldRealPath);
    const isDirectory = stats.isDirectory(); // ディレクトリ判定

    const parentDir = dirname(oldRealPath);
    const newRealPath = join(parentDir, newName);

    // 同名パスの存在チェック
    if (await existsPath(newRealPath)) {
      return {
        success: false,
        error: "同名のファイルまたはフォルダが既に存在します。",
      };
    }

    // 仮想パス上での新パス（DB更新用）
    const oldVirtualDir = dirname(oldVirtualPath);
    const newVirtualPath =
      oldVirtualPath === "/"
        ? `/${newName}`
        : join(oldVirtualDir, newName).replace(/\\/g, "/");

    // 1. まずファイルシステムをリネーム (最も失敗しやすい & 戻しにくい)
    try {
      await rename(oldRealPath, newRealPath);
    } catch (fsError) {
      console.error("FS rename failed...", fsError);
      return {
        success: false,
        error: "ファイルシステムのリネームに失敗しました。",
      };
    }

    // NOTE: サムネイルは再作成すればいいのでリネームしない

    // 2. FSが成功したらDBを更新 (トランザクション)
    try {
      await prisma.$transaction(async (tx) => {
        // 1. 自分自身の更新 (ファイルでもディレクトリでも共通)
        await tx.$executeRaw`
        UPDATE Media 
        SET path = ${newVirtualPath},
            dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")},
            title = ${newName}
        WHERE path = ${oldVirtualPath}
      `;

        // 2. ディレクトリの場合のみ、配下のリソースを更新
        if (isDirectory) {
          // Media配下
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

          // 訪問履歴 (ディレクトリの場合のみ存在する可能性がある)
          await tx.$executeRaw`
          UPDATE VisitedFolder 
          SET dirPath = CASE 
            WHEN dirPath = ${oldVirtualPath} THEN ${newVirtualPath}
            ELSE REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
          END
          WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
        `;
        } else {
          // ファイルの場合でも、自分自身が VisitedFolder に登録されている可能性が万一あれば更新
          // (通常はないはずですが、スキーマ的に dirPath をキーにしているので念のため)
          await tx.$executeRaw`
          UPDATE VisitedFolder SET dirPath = ${newVirtualPath} WHERE dirPath = ${oldVirtualPath}
        `;
        }
      });
    } catch (dbError) {
      // 3. DB更新が失敗した場合、FSを元の名前に戻す (ロールバック)
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

    // キャッシュの更新
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
