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
import { RatingInputSchema } from "@/lib/favorite/schemar";
import { getMediaIdByPath, getMediaIdsByPaths } from "@/lib/media/repository";
import {
  VirtualPathManySchema,
  VirtualPathOneSchema,
} from "@/lib/path/schemas";

// お気に入りレーティング更新
export async function updateFavoriteAction(
  path: string,
  rating: number | null
) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsedPath = VirtualPathOneSchema.safeParse(path);
  if (!parsedPath.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsedPath.error.issues[0].message}`,
    };
  }

  const parsedRating = RatingInputSchema.safeParse(rating);
  if (!parsedRating.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsedRating.error.issues[0].message}`,
    };
  }

  const validPath = parsedPath.data;
  const validRating = parsedRating.data;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validPath);
  if (!mediaId) return { success: false, error: "メディアが見つかりません" };

  try {
    await upsertFavorite({
      userId,
      mediaId,
      rating: validRating,
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
  const parsed = VirtualPathOneSchema.safeParse(path);
  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }
  const validPath = parsed.data;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validPath);
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
  const parsed = VirtualPathOneSchema.safeParse(path);
  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validPath = parsed.data;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(validPath);
  if (!mediaId) return { success: false, error: "メディアが見つかりません" };

  try {
    const favorite = await getFavorite({ userId, mediaId });

    // お気に入り未登録の場合は成功扱いとする
    if (!favorite) return { success: true, favorite: null };

    // クライアント側が期待する { path, rating } の形式で返す
    return {
      success: true,
      favorite: {
        path: validPath,
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
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsedPaths = VirtualPathManySchema.safeParse(paths);
  if (!parsedPaths.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsedPaths.error.issues[0].message}`,
    };
  }

  const parsedRating = RatingInputSchema.safeParse(rating);
  if (!parsedRating.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsedRating.error.issues[0].message}`,
    };
  }

  const validPaths = parsedPaths.data;
  const validRating = parsedRating.data;

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(validPaths);
  if (Object.keys(mediaMap).length === 0) {
    return { success: true, count: 0 };
  }

  // 有効なデータのみを抽出して整形
  const dataToUpsert = validPaths
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
    return { success: true, count: 0 };
  }

  try {
    await upsertMultipleFavorites({
      data: dataToUpsert,
      rating: validRating,
    });
    return { success: true, count: dataToUpsert.length };
  } catch (error) {
    console.error("Failed to update multiple favorites:", error);
    return { success: false, error: "一括更新に失敗しました" };
  }
}

// 一括お気に入り削除
export async function deleteMultipleFavoritesAction(paths: string[]) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsed = VirtualPathManySchema.safeParse(paths);
  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validPaths = parsed.data;

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(validPaths);
  const mediaIds = Object.values(mediaMap);
  if (mediaIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const { count } = await deleteMultipleFavorites({ userId, mediaIds });
    return { success: true, count };
  } catch (error) {
    console.error("Failed to delete multiple favorites:", error);
    return { success: false, error: "一括解除に失敗しました" };
  }
}

// 一括お気に入り再検証
export async function revalidateMultipleFavoritesAction(paths: string[]) {
  // 認証
  const user = await resolveCurrentUserOrThrow();
  const userId = user.id;

  // 入力バリデーション
  const parsed = VirtualPathManySchema.safeParse(paths);
  if (!parsed.success) {
    return {
      success: false,
      error: `不正な入力です: ${parsed.error.issues[0].message}`,
    };
  }

  const validPaths = parsed.data;

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(validPaths);
  const mediaIds = Object.values(mediaMap);
  if (mediaIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const favorites = await getMultipleFavorites({ userId, mediaIds });

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
