"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { getFavorite } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathOneSchema } from "@/lib/virtual-path/schemas";

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
  if (!hasPermission(user, "favorite:revalidate")) {
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
