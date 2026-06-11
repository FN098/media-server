"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { deleteMultipleFavorites } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdsByPaths } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";

type DeleteMultipleFavoritesResult =
  | {
      success: true;
      completed: number;
      failed: number;
      skipped: number;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// 一括お気に入り削除
export async function deleteMultipleFavoritesAction(
  paths: string[]
): Promise<DeleteMultipleFavoritesResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    paths: VirtualPathManySchema.safeParse(paths),
  };
  if (!parsed.paths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "paths", issues: parsed.paths.error?.issues }],
    };
  }

  const normalizedPaths = parsed.paths.data;

  // ルートフォルダ保護
  if (normalizedPaths.some(isRootPath)) {
    return {
      success: false,
      message: "ルートフォルダは操作できません。",
    };
  }

  // システムフォルダ保護
  if (normalizedPaths.some(isSystemHiddenVirtualPath)) {
    return {
      success: false,
      message: "システムフォルダは操作できません。",
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
  const userId = user.id;

  // 認可
  if (!hasPermission(user, "favorite:delete-multiple")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(normalizedPaths);

  const mediaIds = Object.values(mediaMap);
  if (mediaIds.length === 0) {
    return {
      success: false,
      message: "お気に入り削除対象のメディアがありません。",
    };
  }

  let result: Awaited<ReturnType<typeof deleteMultipleFavorites>>;
  try {
    result = await deleteMultipleFavorites({ userId, mediaIds });
  } catch (error) {
    logger.error("action:delete-multiple-favorites", error);
    return { success: false, message: "お気に入り一括解除に失敗しました" };
  }

  const completed = result.count;
  const failed = mediaIds.length - completed;
  const skipped = normalizedPaths.length - completed - failed;

  return { success: true, completed, failed, skipped };
}
