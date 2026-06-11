"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { upsertFavorite } from "@/lib/favorite/repository";
import { RatingInputSchema } from "@/lib/favorite/schemar";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathOneSchema } from "@/lib/virtual-path/schemas";

type UpdateFavoriteResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// お気に入りレーティング更新
export async function updateFavoriteAction(
  path: string,
  rating: number | null
): Promise<UpdateFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    path: VirtualPathOneSchema.safeParse(path),
    rating: RatingInputSchema.safeParse(rating),
  };
  if (!parsed.path.success || !parsed.rating.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "path", issues: parsed.path.error?.issues },
        { prop: "rating", issues: parsed.rating.error?.issues },
      ],
    };
  }

  const normalizedPath = parsed.path.data;
  const normalizedRating = parsed.rating.data;

  // ルートフォルダ保護
  if (isRootPath(normalizedPath)) {
    return {
      success: false,
      message: "ルートフォルダは操作できません。",
    };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedPath)) {
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
  if (!hasPermission(user, "favorite:update")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(normalizedPath);
  if (!mediaId)
    return { success: false, message: "メディアが見つかりません。" };

  try {
    await upsertFavorite({
      userId,
      mediaId,
      rating: normalizedRating,
    });
  } catch (error) {
    logger.error("action:update-favorite", error);
    return { success: false, message: "お気に入りの更新に失敗しました。" };
  }

  return { success: true };
}
