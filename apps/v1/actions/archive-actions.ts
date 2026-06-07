"use server";

import { isArchiveFile } from "@/lib/archive/guards";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { extractArchive } from "@/lib/child_process/7z";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { sumBy } from "@/lib/utils/math";
import {
  basename,
  dirname,
  extname,
  join,
  sanitize,
} from "@/lib/virtual-path/path";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { logger } from "better-auth";
import { lstat, mkdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

export type ExtractionResult =
  | {
      success: true;
      sourcePath: string;
    }
  | {
      success: false;
      error: string;
      sourcePath: string;
    };

export type ExtractionSummaryResult =
  | {
      success: true;
      completed: number;
      failed: number;
      results: ExtractionResult[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * 複数のアーカイブファイルをまとめて解凍するサーバーアクション
 * @param sourceArchives エクスプローラー上の仮想パスの配列 (例: ["folder/file1.zip", "folder/file2.zip"])
 */
export async function extractMultipleArchivesAction(
  sourceArchives: { path: string }[]
): Promise<ExtractionSummaryResult> {
  // 入力バリデーション
  if (!sourceArchives || sourceArchives.length === 0) {
    return {
      success: false,
      error: "処理対象のパスが指定されていません。",
    };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "認証されていません。",
    };
  }

  // 認可
  if (user.role !== "admin") {
    return {
      success: false,
      error: "権限がありません。",
    };
  }

  const results: ExtractionResult[] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を使う)
  for (const { path: sourcePath } of sourceArchives) {
    // パスの正規化
    const normalizedSourcePath = VirtualPathSchema.safeParse(
      sanitize(sourcePath)
    ).data;
    if (!normalizedSourcePath) {
      results.push({
        success: false,
        error: "無効なパスです。",
        sourcePath,
      });
      continue;
    }

    // アーカイブファイル判定
    if (!isArchiveFile(normalizedSourcePath)) {
      results.push({
        success: false,
        error: "有効なアーカイブファイル名ではありません。",
        sourcePath,
      });
      continue;
    }

    // 仮想パス→物理パス
    const srcVirtualPath = normalizedSourcePath;
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // 移動元の存在・ファイル確認
    try {
      const stats = await lstat(srcRealPath);
      if (stats.isDirectory()) {
        results.push({
          success: false,
          error: "ディレクトリは解凍できません。",
          sourcePath,
        });
        continue;
      }
    } catch {
      results.push({
        success: false,
        error: `対象ファイルが見つかりません: ${basename(srcVirtualPath)}`,
        sourcePath,
      });
      continue;
    }

    // 解凍先フォルダ名の決定 (hoge.zip -> hoge)
    const fileBaseName = basename(srcVirtualPath, extname(srcVirtualPath));
    const parentVirtualDir = dirname(srcVirtualPath);
    const destPath = join(parentVirtualDir, fileBaseName);

    // パスの正規化
    const normalizedDestPath = VirtualPathSchema.safeParse(
      sanitize(destPath)
    ).data;
    if (!normalizedDestPath) {
      results.push({
        success: false,
        error: "無効なパスです。",
        sourcePath,
      });
      continue;
    }

    // 仮想パス→物理パス
    let destVirtualDir = normalizedDestPath;
    let destRealPath = getServerMediaPath(destVirtualDir);

    // 同名フォルダの衝突回避
    let counter = 1;
    while (await existsPath(destRealPath)) {
      destVirtualDir = join(
        parentVirtualDir,
        `${fileBaseName} (${counter})`
      ).replace(/\\/g, "/");
      destRealPath = getServerMediaPath(destVirtualDir);
      counter++;
    }

    // 解凍処理の実行
    let isDirCreated = false;
    try {
      // 展開先の実ディレクトリを作成
      await mkdir(destRealPath, { recursive: true });
      isDirCreated = true;

      // 7-Zipを実行して解凍
      await extractArchive(srcRealPath, destRealPath);

      // 個別の成功結果を格納
      results.push({
        sourcePath,
        success: true,
      });
    } catch (e) {
      logger.error("action:extract-multi-archives", e, {
        sourcePath,
      });

      // ロールバック処理
      if (isDirCreated) {
        try {
          await rm(destRealPath, { recursive: true, force: true });
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

  // キャッシュの更新
  revalidatePath("/explorer");

  // 結果を集計
  const completed = sumBy(results, (result) => (result.success ? 1 : 0));
  const failed = results.length - completed;

  return {
    success: true,
    completed,
    failed,
    results,
  };
}
