"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { getMultipleFavorites } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdsByPaths } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";

type RevalidateMultipleFavoritesResult =
  | {
      success: true;
      favorites: {
        path: string;
        rating: number | null;
      }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// 一括お気に入り再検証
export async function revalidateMultipleFavoritesAction(
  paths: string[]
): Promise<RevalidateMultipleFavoritesResult> {
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
  if (!hasPermission(user, "favorite:revalidate-multiple")) {
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
      message: "お気に入り再検証対象のメディアがありません。",
    };
  }

  let favorites: Awaited<ReturnType<typeof getMultipleFavorites>>;
  try {
    favorites = await getMultipleFavorites({ userId, mediaIds });
  } catch (error) {
    logger.error("action:revalidate-multiple-favorites", error);
    return { success: false, message: "お気に入り一括再検証に失敗しました" };
  }

  // クライアントが Map に復元しやすい形式で返す
  // 例: [{ path: "a", rating: 5 }, { path: "b", rating: null }]
  return {
    success: true,
    favorites: favorites.map((f) => ({ path: f.path, rating: f.rating })),
  };
}
