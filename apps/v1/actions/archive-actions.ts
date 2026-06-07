"use server";

import { isArchiveFile } from "@/lib/archive/guards";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { extractArchive } from "@/lib/child_process/7z";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath, isFsNotFoundError } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { basename, dirname, extname, join } from "@/lib/virtual-path/path";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";
import { lstat, mkdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type ExtractArchivesResult =
  | {
      success: true;
      completed: { sourcePath: string }[];
      failed: { sourcePath: string; message: string }[];
      skipped: { sourcePath: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type ExtractArchivesSuccess = Extract<ExtractArchivesResult, { success: true }>;

/**
 * 複数のアーカイブファイルをまとめて解凍するサーバーアクション
 * @param sourceArchives エクスプローラー上の仮想パスの配列 (例: ["folder/file1.zip", "folder/file2.zip"])
 */
export async function extractArchivesAction(
  sourceArchives: { path: string }[]
): Promise<ExtractArchivesResult> {
  // 入力バリデーション＋正規化
  if (!sourceArchives || sourceArchives.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(
      sourceArchives.map((arc) => sanitize(arc.path))
    ),
  };
  if (!parsed.sourcePaths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        {
          prop: "sourceArchives[].path",
          issues: parsed.sourcePaths.error?.issues,
        },
      ],
    };
  }

  const normalizedSourcePaths = parsed.sourcePaths.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "archive:extract")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  const completed: ExtractArchivesSuccess["completed"] = [];
  const failed: ExtractArchivesSuccess["failed"] = [];
  const skipped: ExtractArchivesSuccess["skipped"] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を使う)
  for (const sourcePath of normalizedSourcePaths) {
    if (!isArchiveFile(sourcePath)) {
      skipped.push({
        sourcePath,
        message: "有効なアーカイブファイルではありません。",
      });
      continue;
    }

    // 仮想パス→物理パス
    const srcVirtualPath = sourcePath;
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // 移動元の存在・ファイル確認
    try {
      const stats = await lstat(srcRealPath);
      if (stats.isDirectory()) {
        skipped.push({ sourcePath, message: "ディレクトリは解凍できません。" });
        continue;
      }
    } catch (e) {
      if (isFsNotFoundError(e)) {
        failed.push({ sourcePath, message: "対象ファイルが見つかりません。" });
        continue;
      }
      throw e;
    }

    // 解凍先フォルダ名の決定 (hoge.zip -> hoge)
    const fileBaseName = basename(srcVirtualPath, extname(srcVirtualPath));
    const parentVirtualDir = dirname(srcVirtualPath);

    // 仮想パス→物理パス
    let destVirtualDir = join(parentVirtualDir, fileBaseName);
    let destRealPath = getServerMediaPath(destVirtualDir);

    // 同名フォルダの衝突回避
    let counter = 2;
    while (await existsPath(destRealPath)) {
      destVirtualDir = sanitize(
        join(parentVirtualDir, `${fileBaseName} (${counter})`)
      );
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
    } catch (e) {
      logger.error("action:extract-archives", e, {
        sourcePath,
      });

      // ロールバック処理
      if (isDirCreated) {
        try {
          await rm(destRealPath, { recursive: true, force: true });
        } catch (e) {
          logger.error("action:extract-archives:rollback", e);
        }
      }

      const errorMessage =
        e instanceof Error
          ? e.message
          : "解凍処理中に不明なエラーが発生しました。";

      failed.push({ sourcePath, message: errorMessage });
    }

    completed.push({ sourcePath });
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
