"use server";

import { getMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { rename } from "fs/promises";
import { revalidatePath } from "next/cache";
import { dirname, join } from "path";

// TODO: newName のバリデーション

/**
 * ファイルまたはフォルダのリネーム
 * @param oldPath 元のフルパス
 * @param newName 新しい名前（ファイル名・フォルダ名のみ）
 */
export async function renameNodeAction(oldPath: string, newName: string) {
  try {
    // 親ディレクトリを取得し、新しいフルパスを構築
    const realOldPath = getMediaPath(oldPath);
    const parentDir = dirname(realOldPath);
    const newPath = join(parentDir, newName);

    // 同名パスの存在チェック
    const exists = await existsPath(newPath);
    if (exists) {
      return {
        success: false,
        error: "同名のファイルまたはフォルダが既に存在します。",
      };
    }

    // リネーム実行
    await rename(realOldPath, newPath);

    // キャッシュの更新
    // 親ディレクトリの表示を更新する必要があるため、キャッシュを無効化
    revalidatePath("/explorer");

    return {
      success: true,
      newPath: newPath,
    };
  } catch (error) {
    console.error("Rename Error:", error);
    return {
      success: false,
      error: "リネーム中にエラーが発生しました。権限などを確認してください。",
    };
  }
}
