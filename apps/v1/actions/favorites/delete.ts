"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { deleteFavorite } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathOneSchema } from "@/lib/virtual-path/schemas";

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
