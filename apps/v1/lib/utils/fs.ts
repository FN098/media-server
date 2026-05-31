import { access, lstat, readdir, rename, rm, rmdir, stat } from "fs/promises";
import path from "path";
import { join } from "path/posix";

/** @deprecated */
export async function existsPath(path: string): Promise<boolean> {
  try {
    await access(path);
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

  const stats = await stat(dir);
  if (!stats.isDirectory()) return;

  // 1. 中身を読み込む
  let files = await readdir(dir);

  // 2. 子ディレクトリがあれば、まずそっちを掃除しに行く
  if (files.length > 0) {
    await Promise.all(
      files.map((file) => removeEmptyDirs(path.join(dir, file), rootPath))
    );
    // 子が消えたかもしれないので再読み込み
    files = await readdir(dir);
  }

  // 3. ルートディレクトリ自体ではなく、かつ中身が空なら削除
  if (dir !== rootPath && files.length === 0) {
    try {
      await rmdir(dir);
      // console.log(`Deleted empty dir: ${dir}`);
    } catch {
      // 他のプロセスが同時に触った場合などのエラーは無視
    }
  }
}

// 再帰的な移動
export async function recursiveMergeMove(src: string, dest: string) {
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
