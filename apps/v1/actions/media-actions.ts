"use server";

import { renameSchema } from "@/lib/media/validation";
import { getMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { existsPath } from "@/lib/utils/fs";
import { rename } from "fs/promises";
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
    const realOldPath = getMediaPath(oldVirtualPath);
    const parentDir = dirname(realOldPath);
    const realNewPath = join(parentDir, newName);

    // 同名パスの存在チェック
    if (await existsPath(realNewPath)) {
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

    // DB更新 (トランザクション)
    await prisma.$transaction(async (tx) => {
      // フォルダのリネームの場合、配下のすべてのパスを置換する必要がある
      // 例: /old-dir/file.jpg -> /new-dir/file.jpg

      // 1. 自分自身の更新 (path, dirPath, title をすべて更新)
      await tx.$executeRaw`
        UPDATE Media 
        SET path = ${newVirtualPath},
            dirPath = ${dirname(newVirtualPath).replace(/\\/g, "/")},
            title = ${newName}
        WHERE path = ${oldVirtualPath}
      `;

      // 2. 配下ノードの更新 (path と dirPath の文字列置換のみ、title は触らない)
      await tx.$executeRaw`
        UPDATE Media 
        SET path = REPLACE(path, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/')),
            dirPath = REPLACE(dirPath, CONCAT(${oldVirtualPath}, '/'), CONCAT(${newVirtualPath}, '/'))
        WHERE path LIKE CONCAT(${oldVirtualPath}, '/%')
      `;

      // 3. 訪問履歴の更新 (自分自身 + 配下すべてを一括置換)
      await tx.$executeRaw`
        UPDATE VisitedFolder 
        SET dirPath = REPLACE(dirPath, ${oldVirtualPath}, ${newVirtualPath})
        WHERE dirPath = ${oldVirtualPath} OR dirPath LIKE CONCAT(${oldVirtualPath}, '/%')
      `;
    });

    // リネーム実行
    await rename(realOldPath, realNewPath);

    // NOTE: サムネイルは再作成すればいいのでリネームしない

    // キャッシュの更新
    revalidatePath("/explorer");

    return {
      success: true,
      newPath: realNewPath,
    };
  } catch (error) {
    console.error("Rename Error:", error);
    return {
      success: false,
      error: "リネーム中にエラーが発生しました。権限などを確認してください。",
    };
  }
}
