"use server";

import { isArchiveFile } from "@/lib/archive/guards";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { extractArchive } from "@/lib/child_process/7z";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath, isFsNotFoundError } from "@/lib/utils/fs";
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
      completed: { sourcePath: string }[];
      failed: { sourcePath: string; message: string }[];
      skipped: { sourcePath: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      inputErrors?: { path: string; message: string }[];
    };

/**
 * 複数のアーカイブファイルをまとめて解凍するサーバーアクション
 * @param sourceArchives エクスプローラー上の仮想パスの配列 (例: ["folder/file1.zip", "folder/file2.zip"])
 */
export async function extractArchivesAction(
  sourceArchives: { path: string }[]
): Promise<ExtractionResult> {
  // 入力バリデーション＋正規化
  if (!sourceArchives || sourceArchives.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const inputErrors = [] as { path: string; message: string }[];

  const normalizedArchives = sourceArchives
    .map((arc) => {
      const sanitized = sanitize(arc.path);
      const parsed = VirtualPathSchema.safeParse(sanitized);
      if (!parsed.success) {
        inputErrors.push({ path: arc.path, message: "無効なパスです。" });
        return null;
      }

      const path = parsed.data;

      if (!isArchiveFile(path)) {
        inputErrors.push({
          path: arc.path,
          message: "有効なアーカイブファイルではありません。",
        });
        return null;
      }

      return { path };
    })
    .filter((arc) => arc != null);

  if (inputErrors.length > 0) {
    return {
      success: false,
      message: "入力エラーがあります。",
      inputErrors,
    };
  }

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

  const completed: Extract<ExtractionResult, { success: true }>["completed"] =
    [];
  const failed: Extract<ExtractionResult, { success: true }>["failed"] = [];
  const skipped: Extract<ExtractionResult, { success: true }>["skipped"] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を使う)
  for (const { path: sourcePath } of normalizedArchives) {
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
    let counter = 1;
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

      completed.push({ sourcePath });
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
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
