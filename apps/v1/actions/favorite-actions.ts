"use server";

import {
  resolveCurrentUser,
  resolveCurrentUserOrThrow,
} from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import {
  deleteFavorite,
  deleteMultipleFavorites,
  getFavorite,
  getMultipleFavorites,
  upsertFavorite,
  upsertMultipleFavorites,
} from "@/lib/favorite/repository";
import { RatingInputSchema } from "@/lib/favorite/schemar";
import { logger } from "@/lib/logger";
import { getMediaIdByPath, getMediaIdsByPaths } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import {
  VirtualPathManySchema,
  VirtualPathOneSchema,
} from "@/lib/virtual-path/schemas";

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

type DeleteFavoriteResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// お気に入り削除 (レコード自体の消去)
export async function deleteFavoriteAction(
  path: string
): Promise<DeleteFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    path: VirtualPathOneSchema.safeParse(path),
  };
  if (!parsed.path.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "path", issues: parsed.path.error?.issues }],
    };
  }

  const normalizedPath = parsed.path.data;

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
  if (!hasPermission(user, "favorite:delete")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(normalizedPath);
  if (!mediaId) return { success: false, message: "メディアが見つかりません" };

  try {
    await deleteFavorite({ userId, mediaId });
  } catch (error) {
    logger.error("action:delete-favorite", error);
    return { success: false, message: "お気に入り解除に失敗しました" };
  }

  return { success: true };
}

type RevalidateFavoriteResult =
  | {
      success: true;
      favorite: {
        path: string;
        rating: number | null;
      } | null;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// お気に入り再検証
export async function revalidateFavoriteAction(
  path: string
): Promise<RevalidateFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    path: VirtualPathOneSchema.safeParse(path),
  };
  if (!parsed.path.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "path", issues: parsed.path.error?.issues }],
    };
  }

  const normalizedPath = parsed.path.data;

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
  if (!hasPermission(user, "favorite:delete")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(normalizedPath);
  if (!mediaId) return { success: false, message: "メディアが見つかりません" };

  let favorite: Awaited<ReturnType<typeof getFavorite>>;
  try {
    favorite = await getFavorite({ userId, mediaId });
  } catch (error) {
    logger.error("action:revalidate-favorite", error);
    return { success: false, message: "再検証に失敗しました" };
  }

  // お気に入り未登録の場合は成功扱いとする
  if (!favorite) return { success: true, favorite: null };

  // クライアント側が期待する { path, rating } の形式で返す
  return {
    success: true,
    favorite: {
      path: normalizedPath,
      rating: favorite.rating,
    },
  };
}

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
    await upsertMultipleFavorites({
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

// TODO
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
