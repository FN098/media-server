"use server";

import { extractWith7Zip } from "@/lib/child_process/7-zip";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsSync, promises as fsPromises } from "fs";
import { revalidatePath } from "next/cache";
import { basename, dirname, extname, join } from "path";

type ExtractionResult = {
  sourcePath: string;
  success: boolean;
  error?: string;
};

/**
 * 複数のアーカイブファイルをまとめて解凍するサーバーアクション
 * @param sourceArchives エクスプローラー上の仮想パスの配列 (例: ["folder/file1.zip", "folder/file2.zip"])
 */
export async function extractMultipleArchivesNodeAction(
  sourceArchives: { path: string }[]
) {
  if (!sourceArchives || sourceArchives.length === 0) {
    return {
      success: false,
      error: "処理対象のパスが指定されていません。",
      results: [],
    };
  }

  const results: ExtractionResult[] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を推奨)
  for (const { path: sourcePath } of sourceArchives) {
    // 1. パスの正規化
    const normalizedSourcePath = sourcePath.replace(/^\/+/, "");
    if (normalizedSourcePath === "") {
      results.push({
        sourcePath,
        success: false,
        error: "無効なパスです。",
      });
      continue; // 次のファイルへ
    }

    const srcVirtualPath = normalizedSourcePath;
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // 2. 移動元の存在・ファイル確認
    try {
      const stats = await fsPromises.lstat(srcRealPath);
      if (!stats.isFile()) {
        results.push({
          sourcePath,
          success: false,
          error: "ディレクトリは解凍できません。",
        });
        continue;
      }
    } catch {
      results.push({
        sourcePath,
        success: false,
        error: `対象ファイルが見つかりません: ${basename(srcVirtualPath)}`,
      });
      continue;
    }

    // 3. 解凍先フォルダ名の決定 (hoge.zip -> hoge)
    const fileBaseName = basename(srcVirtualPath, extname(srcVirtualPath));
    const parentVirtualDir = dirname(srcVirtualPath);

    let destVirtualDir = join(parentVirtualDir, fileBaseName).replace(
      /\\/g,
      "/"
    );
    let destRealPath = getServerMediaPath(destVirtualDir);

    // 同名フォルダの衝突回避
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

      // 個別の成功結果を格納
      results.push({
        sourcePath,
        success: true,
      });
    } catch (e) {
      console.error(`Extraction Action Error [${sourcePath}]:`, e);

      // ロールバック処理
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

      results.push({
        sourcePath,
        success: false,
        error: errorMessage,
      });
    }
  }

  // 5. キャッシュの更新（ループの外で1回だけ実行）
  revalidatePath("/explorer");

  // 全て成功したかどうかを判定
  const allSuccess = results.every((r) => r.success);
  const anySuccess = results.some((r) => r.success);

  return {
    success: allSuccess,
    hasPartialSuccess: !allSuccess && anySuccess, // 一部だけ成功したか
    results,
  };
}
