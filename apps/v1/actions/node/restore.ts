"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import {
  getServerMediaPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { unique } from "@/lib/utils/array";
import { recursiveMergeMove } from "@/lib/utils/fs";
import { dirname } from "@/lib/virtual-path/path";
import { EditableVirtualPathManySchema } from "@/lib/virtual-path/schemas";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  sourcePaths: EditableVirtualPathManySchema.min(
    1,
    "ファイルまたはフォルダを1件以上指定してください。"
  ).transform((paths) => unique(paths)),
});

type ActionResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
    };

type Success = Extract<ActionResult, { success: true }>;

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreManyNodesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePaths } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:restore-many", "folder:restore-many");
  if (!auth.success) {
    return auth;
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  for (const srcVirtualPath of sourcePaths) {
    // ゴミ箱から元のフォルダに移動しても仮想パスは変わらない（物理パスのみ変更）
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);
    const destRealParentPath = dirname(destRealPath);

    // 移動先フォルダ作成
    try {
      await mkdir(destRealParentPath, { recursive: true });
    } catch (e) {
      logger.error("action:restore:create-direcory", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:restore:move", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // DB更新不要：元のフォルダへの移動のみ

    completed.push({ path: srcVirtualPath });
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
    revalidatePath("/trash");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
