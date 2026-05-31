"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import {
  deleteFavorite,
  deleteMultipleFavorites,
  getFavorite,
  getMultipleFavorites,
  upsertFavorite,
  upsertMultipleFavorites,
} from "@/lib/favorite/repository";
import { UpsertFavoriteInputSchema } from "@/lib/favorite/schemar";
import { getMediaIdByPath, getMediaIdsByPaths } from "@/lib/media/repository";
import { VirtualPathSchema } from "@/lib/path/schemas";
import { clamp } from "@/lib/utils/clamp";

// お気に入りレーティング更新
export async function updateFavoriteAction(
  path: string,
  rating: number | null
) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsed = UpsertFavoriteInputSchema.safeParse({
    path,
    rating,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validated = parsed.data;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validated.path);
  if (!mediaId) return { success: false, error: "メディアが見つかりません" };

  try {
    await upsertFavorite({
      userId,
      mediaId,
      rating: validated.rating,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return { success: false, error: "お気に入りの更新に失敗しました" };
  }
}

// お気に入り削除 (レコード自体の消去)
export async function deleteFavoriteAction(path: string) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsed = VirtualPathSchema.safeParse(path);

  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validated = { path: parsed.data };

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validated.path);
  if (!mediaId) return { success: false, error: "メディアが見つかりません" };

  try {
    await deleteFavorite({ userId, mediaId });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete favorite:", error);
    return { success: false, error: "お気に入り解除に失敗しました" };
  }
}

// お気に入り再検証
export async function revalidateFavoriteAction(path: string) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsed = VirtualPathSchema.safeParse(path);

  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validated = { path: parsed.data };

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validated.path);
  if (!mediaId) return { success: false, error: "メディアが見つかりません" };

  try {
    const favorite = await getFavorite({ userId, mediaId });

    // お気に入り未登録の場合は成功扱いとする
    if (!favorite) return { success: true, favorite: null };

    // クライアント側が期待する { path, rating } の形式で返す
    return {
      success: true,
      favorite: {
        path: validated.path,
        rating: favorite.rating,
      },
    };
  } catch (error) {
    console.error("Failed to revalidate favorite:", error);
    return { success: false, error: "再検証に失敗しました" };
  }
}

// 一括お気に入り登録・更新
export async function updateMultipleFavoritesAction(
  paths: string[],
  rating: number | null
) {
  try {
    const user = await resolveCurrentUserOrThrow();
    const mediaMap = await getMediaIdsByPaths(paths);

    if (Object.keys(mediaMap).length === 0) {
      return { success: true, count: 0 };
    }

    const validRating = rating !== null ? clamp(rating, 1, 5) : null;

    // 有効なデータのみを抽出して整形
    const dataToUpsert = paths
      .map((path) => {
        const mediaId = mediaMap[path];
        if (!mediaId) return null;
        return {
          userId: user.id,
          mediaId,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    if (dataToUpsert.length === 0) {
      return { success: true, count: 0 };
    }

    // 一括保存
    await upsertMultipleFavorites(dataToUpsert, validRating);

    return { success: true, count: dataToUpsert.length };
  } catch (error) {
    console.error("Failed to update multiple favorites:", error);
    return { success: false, error: "一括更新に失敗しました" };
  }
}

// 一括お気に入り削除
export async function deleteMultipleFavoritesAction(paths: string[]) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const mediaMap = await getMediaIdsByPaths(paths);
    const mediaIds = Object.values(mediaMap);

    if (mediaIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 一括削除
    const { count } = await deleteMultipleFavorites(user.id, mediaIds);

    return { success: true, count };
  } catch (error) {
    console.error("Failed to delete multiple favorites:", error);
    return { success: false, error: "一括解除に失敗しました" };
  }
}

// 一括お気に入り再検証
export async function revalidateMultipleFavoritesAction(paths: string[]) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const mediaMap = await getMediaIdsByPaths(paths);
    const mediaIds = Object.values(mediaMap);

    if (mediaIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 一括取得
    const favorites = await getMultipleFavorites(user.id, mediaIds);

    // クライアントが Map に復元しやすい形式で返す
    // 例: [{ path: "/a", rating: 5 }, { path: "/b", rating: null }]
    return {
      success: true,
      favorites: favorites.map((f) => ({ path: f.path, rating: f.rating })),
    };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
