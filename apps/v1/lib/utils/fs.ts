import fs from "fs/promises";
import path from "path";

export async function existsPath(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 指定したディレクトリ配下の空フォルダを再帰的に削除する
 */
export async function removeEmptyDirs(
  dir: string,
  rootPath: string
): Promise<void> {
  // ルートパスより外側は絶対に触らない安全策
  if (!dir.startsWith(rootPath)) return;

  const stats = await fs.stat(dir);
  if (!stats.isDirectory()) return;

  // 1. 中身を読み込む
  let files = await fs.readdir(dir);

  // 2. 子ディレクトリがあれば、まずそっちを掃除しに行く
  if (files.length > 0) {
    await Promise.all(
      files.map((file) => removeEmptyDirs(path.join(dir, file), rootPath))
    );
    // 子が消えたかもしれないので再読み込み
    files = await fs.readdir(dir);
  }

  // 3. ルートディレクトリ自体ではなく、かつ中身が空なら削除
  if (dir !== rootPath && files.length === 0) {
    try {
      await fs.rmdir(dir);
      // console.log(`Deleted empty dir: ${dir}`);
    } catch {
      // 他のプロセスが同時に触った場合などのエラーは無視
    }
  }
}
