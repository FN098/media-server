"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { logger } from "@/lib/logger";
import { updateMediaFileMtime } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";

type TouchMediaTimestampActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// タイムスタンプ更新
export async function touchMediaTimestampAction(
  sourcePath: string
): Promise<TouchMediaTimestampActionResult> {
  // 入力バリデーション＋正規化
  if (!sourcePath) {
    return {
      success: false,
      message: "処理対象のパスまたは名前が指定されていません。",
    };
  }

  const parsed = {
    sourcePath: VirtualPathSchema.safeParse(sanitize(sourcePath)),
  };
  if (!parsed.sourcePath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "sourcePath", issues: parsed.sourcePath.error?.issues }],
    };
  }

  const normalizedSourcePath = parsed.sourcePath.data;

  // ルートフォルダ保護
  if (isRootPath(normalizedSourcePath)) {
    return { success: false, message: "ルートフォルダは操作できません。" };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedSourcePath)) {
    return { success: false, message: "システムフォルダは操作できません。" };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const srcVirtualPath = normalizedSourcePath;

  // FS 更新不要：タイムスタンプは utime や open->close では更新されないため
  // DB 更新
  try {
    await updateMediaFileMtime({ path: srcVirtualPath });
  } catch (e) {
    logger.error("action:touch-timestamp", e);
    return {
      success: false,
      message: "タイムスタンプの更新に失敗しました。",
    };
  }

  return { success: true };
}
