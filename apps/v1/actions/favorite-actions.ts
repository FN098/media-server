"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import {
  deleteFavorite,
  getFavorite,
  upsertFavorite,
} from "@/repositories/favorite-repository";
import { findMediaByPath } from "@/repositories/media-repository";

/**
 * お気に入りの状態を更新する
 * rating が null の場合は削除、数値の場合は作成または更新
 */
export async function updateFavoriteAction(
  path: string,
  rating: number | null
) {
  try {
    const user = await resolveCurrentUserOrThrow();
    const media = await findMediaByPath(path);

    if (!media) return { success: false, error: "メディアが見つかりません" };

    if (rating === null) {
      await deleteFavorite(user.id, media.id);
    } else {
      // 1~5の範囲にクランプ（念のためのバリデーション）
      const validatedRating = Math.max(1, Math.min(5, rating));
      await upsertFavorite(user.id, media.id, validatedRating);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return { success: false, error: "お気に入りの更新に失敗しました" };
  }
}

/**
 * 最新のDB状態を取得してクライアントと同期する
 */
export async function revalidateFavoriteAction(path: string) {
  try {
    const user = await resolveCurrentUserOrThrow();
    const media = await findMediaByPath(path);

    if (!media) return { success: false, error: "メディアが見つかりません" };

    const favorite = await getFavorite(user.id, media.id);

    // クライアント側が期待する { path, rating } の形式で返す
    return {
      success: true,
      favorite: favorite ? { path, rating: favorite.rating } : null,
    };
  } catch (error) {
    console.error("Failed to revalidate favorite:", error);
    return { success: false, error: "再検証に失敗しました" };
  }
}
