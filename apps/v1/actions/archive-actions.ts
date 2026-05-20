"use server";

import { extractWith7Zip } from "@/lib/7zip";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsSync, promises as fsPromises } from "fs";
import { revalidatePath } from "next/cache";
import { basename, dirname, extname, join } from "path";

/**
 * アーカイブファイルを解凍するサーバーアクション（DB操作なし）
 * @param sourcePath エクスプローラー上の仮想パス (例: "folder/file.zip")
 */
export async function extractArchiveNodeAction(sourcePath: string) {
  // 1. パスの正規化
  const normalizedSourcePath = sourcePath.replace(/^\/+/, "");
  if (normalizedSourcePath === "") {
    return {
      success: false,
      error: "無効なパスです。",
    };
  }

  const srcVirtualPath = normalizedSourcePath;
  const srcRealPath = getServerMediaPath(srcVirtualPath);

  // 2. 移動元の存在・ファイル確認
  try {
    const stats = await fsPromises.lstat(srcRealPath);
    if (!stats.isFile()) {
      return {
        success: false,
        error: "ディレクトリは解凍できません。",
      };
    }
  } catch {
    return {
      success: false,
      error: `対象ファイルが見つかりません: ${basename(srcVirtualPath)}`,
    };
  }

  // 3. 解凍先フォルダ名の決定 (hoge.zip -> hoge)
  const fileBaseName = basename(srcVirtualPath, extname(srcVirtualPath));
  const parentVirtualDir = dirname(srcVirtualPath);

  // 仮想パスはスラッシュ区切りに統一
  let destVirtualDir = join(parentVirtualDir, fileBaseName).replace(/\\/g, "/");
  let destRealPath = getServerMediaPath(destVirtualDir);

  // 同名フォルダが既に存在する場合は、hoge (1), hoge (2) のように自動リネームして衝突を回避
  let counter = 1;
  while (existsSync(destRealPath)) {
    destVirtualDir = join(
      parentVirtualDir,
      `${fileBaseName} (${counter})`
    ).replace(/\\/g, "/");
    destRealPath = getServerMediaPath(destVirtualDir);
    counter++;
  }

  // 4. 解凍処理の実行
  let isDirCreated = false;
  try {
    // 展開先の実ディレクトリを作成
    await fsPromises.mkdir(destRealPath, { recursive: true });
    isDirCreated = true;

    // 7-Zipを実行して解凍
    await extractWith7Zip(srcRealPath, destRealPath);
  } catch (e) {
    console.error("Extraction Action Error:", e);

    // ロールバック: 途中で失敗した場合は作成したディレクトリをクリーンアップ
    if (isDirCreated && existsSync(destRealPath)) {
      try {
        await fsPromises.rm(destRealPath, { recursive: true, force: true });
      } catch (rmError) {
        console.error("Extraction Rollback Error:", rmError);
      }
    }

    const errorMessage =
      e instanceof Error
        ? e.message
        : "解凍処理中に不明なエラーが発生しました。";

    return {
      success: false,
      error: errorMessage,
    };
  }

  // 5. キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}
