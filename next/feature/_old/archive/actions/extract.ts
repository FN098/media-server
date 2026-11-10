"use server";

import { authorize } from "@/lib/authorization/authorize";
import { extractArchive } from "@/lib/child_process/7z";
import { getFilePath } from "@/lib/file/repository";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { existsPath, getPathInfo } from "@/lib/utils/fs";
import { basename, dirname, extname, join } from "@/lib/virtual-path";
import { sanitizeVirtualPath } from "@/lib/virtual-path/sanitize";
import { mkdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type ActionResult =
  | {
      success: true;
      completed: { fileId: string }[];
      failed: { fileId: string; message: string }[];
      skipped: { fileId: string; message: string }[];
    }
  | {
      success: false;
      message: string;
    };

type Success = Extract<ActionResult, { success: true }>;

export async function extractManyArchivesAction({
  fileIds,
}: {
  fileIds: string[];
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("archive:extract-many");
  if (!auth.success) {
    return auth;
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を使う)
  for (const fileId of fileIds) {
    let sourcePath: string;
    try {
      sourcePath = await getFilePath(fileId);
    } catch (error) {
      failed.push({ fileId, message: "対象ファイルがDB上で見つかりません。" });
      continue;
    }

    // 仮想パス→物理パス
    const srcVirtualPath = sourcePath;
    const srcRealPath = resolveMediaPath(srcVirtualPath);

    // 移動元の存在・ファイル確認
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (srcPathInfo.exists && srcPathInfo.isDirectory) {
      skipped.push({ fileId, message: "ディレクトリは解凍できません。" });
      continue;
    }
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          fileId,
          message: "対象ファイルがFS上で見つかりません。",
        });
        continue;
      }
      failed.push({ fileId, message: "対象パスにアクセスできません。" });
      continue;
    }

    // 解凍先フォルダ名の決定 (hoge.zip -> hoge)
    const fileBaseName = basename(srcVirtualPath, extname(srcVirtualPath));
    const parentVirtualDir = dirname(srcVirtualPath);

    // 仮想パス→物理パス
    let destVirtualDir = join(parentVirtualDir, fileBaseName);
    let destRealPath = resolveMediaPath(destVirtualDir);

    // 同名フォルダの衝突回避
    let counter = 2;
    while (await existsPath(destRealPath)) {
      destVirtualDir = sanitizeVirtualPath(
        join(parentVirtualDir, `${fileBaseName} (${counter})`)
      );
      destRealPath = resolveMediaPath(destVirtualDir);
      counter++;
    }

    // 解凍処理の実行
    let isDirCreated = false;
    try {
      // 展開先のディレクトリを作成
      await mkdir(destRealPath, { recursive: true });
      isDirCreated = true;

      // 7-Zipを実行して解凍
      await extractArchive(srcRealPath, destRealPath);

      completed.push({ fileId });
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

      failed.push({ fileId, message: errorMessage });
    }
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
