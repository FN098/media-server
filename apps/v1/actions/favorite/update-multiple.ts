"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { upsertManyFavorites } from "@/lib/favorite/repository";
import { RatingInputSchema } from "@/lib/favorite/schemar";
import { logger } from "@/lib/logger";
import { getMediaIdsByPaths } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";

type UpdateMultipleFavoritesResult =
  | {
      success: true;
      completed: number;
      skipped: number;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// 一括お気に入り登録・更新
export async function updateMultipleFavoritesAction(
  paths: string[],
  rating: number | null
): Promise<UpdateMultipleFavoritesResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    paths: VirtualPathManySchema.safeParse(paths),
    rating: RatingInputSchema.safeParse(rating),
  };
  if (!parsed.paths.success || !parsed.rating.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "paths", issues: parsed.paths.error?.issues },
        { prop: "rating", issues: parsed.rating.error?.issues },
      ],
    };
  }

  const normalizedPaths = parsed.paths.data;
  const normalizedRating = parsed.rating.data;

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
  if (!hasPermission(user, "favorite:update-multiple")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(normalizedPaths);

  // 有効なデータのみを抽出して整形
  const dataToUpsert = normalizedPaths
    .map((path) => {
      const mediaId = mediaMap[path];
      if (!mediaId) return null;
      return {
        userId,
        mediaId,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (dataToUpsert.length === 0) {
    return {
      success: false,
      message: "お気に入り更新対象のメディアがありません。",
    };
  }

  try {
    await upsertManyFavorites({
      data: dataToUpsert,
      rating: normalizedRating,
    });
  } catch (error) {
    logger.error("action:update-multiple-favorites", error);
    return { success: false, message: "お気に入り一括更新に失敗しました" };
  }

  const completed = dataToUpsert.length;
  const skipped = normalizedPaths.length - completed;

  return { success: true, completed, skipped };
}
