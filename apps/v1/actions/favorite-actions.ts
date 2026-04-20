"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import {
  deleteFavorite,
  getFavorite,
  upsertFavorite,
} from "@/lib/favorite/repository";
import { getMediaIdByPath } from "@/lib/media/repository";
import { clamp } from "@/lib/utils/clamp";

// お気に入りレーティング更新
export async function updateFavoriteAction(
  path: string,
  rating: number | null
) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const mediaId = await getMediaIdByPath(path);
    if (!mediaId) return { success: false, error: "メディアが見つかりません" };

    // バリデーション: 数値がある場合は 1~5 にクランプ
    const validRating = rating !== null ? clamp(rating, 1, 5) : null;

    await upsertFavorite(user.id, mediaId, validRating);

    return { success: true };
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return { success: false, error: "お気に入りの更新に失敗しました" };
  }
}

// お気に入り削除 (レコード自体の消去)
export async function deleteFavoriteAction(path: string) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const mediaId = await getMediaIdByPath(path);
    if (!mediaId) return { success: false, error: "メディアが見つかりません" };

    await deleteFavorite(user.id, mediaId);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete favorite:", error);
    return { success: false, error: "お気に入り解除に失敗しました" };
  }
}

// お気に入り再検証
export async function revalidateFavoriteAction(path: string) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const mediaId = await getMediaIdByPath(path);
    if (!mediaId) return { success: false, error: "メディアが見つかりません" };

    const favorite = await getFavorite(user.id, mediaId);

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
