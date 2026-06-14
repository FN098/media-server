"use server";

import { isArchiveFile } from "@/lib/archive/guards";
import { authorize } from "@/lib/authorization/authorize";
import { extractArchive } from "@/lib/child_process/7z";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath, getPathInfo } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { basename, dirname, extname, join } from "@/lib/virtual-path/path";
import { EditableVirtualPathManySchema } from "@/lib/virtual-path/schemas";
import { mkdir, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  paths: EditableVirtualPathManySchema.superRefine((paths, ctx) => {
    paths.forEach((path, index) => {
      if (!isArchiveFile(path)) {
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "有効なアーカイブファイルではありません。",
        });
      }
    });
  }),
});

type ActionResult =
  | {
      success: true;
      completed: { sourcePath: string }[];
      failed: { sourcePath: string; message: string }[];
      skipped: { sourcePath: string; message: string }[];
    }
  | {
      success: false;
      message: string;
    };

type Success = Extract<ActionResult, { success: true }>;

export async function extractManyArchivesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { paths } = parsed.data;

  // 認証＋認可
  const auth = await authorize("archive:extract-many");
  if (!auth.success) {
    return auth;
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  // 各パスを順番に処理 (並列実行でディスクI/Oが詰まるのを防ぐため for...of を使う)
  for (const sourcePath of paths) {
    // 仮想パス→物理パス
    const srcVirtualPath = sourcePath;
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // 移動元の存在・ファイル確認
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (srcPathInfo.exists && srcPathInfo.isDirectory) {
      skipped.push({ sourcePath, message: "ディレクトリは解凍できません。" });
      continue;
    }
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({ sourcePath, message: "対象ファイルが見つかりません。" });
        continue;
      }
      failed.push({ sourcePath, message: "対象パスにアクセスできません。" });
      continue;
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
      // 展開先のディレクトリを作成
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
