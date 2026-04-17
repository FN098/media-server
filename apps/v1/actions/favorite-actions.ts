"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { prisma } from "@/lib/prisma";
import {
  deleteFavorite,
  getFavorite,
  upsertFavorite,
} from "@/repositories/favorite-repository";

// お気に入り更新
export async function updateFavoriteAction(
  path: string,
  rating: number | null
) {
  try {
    const user = await resolveCurrentUserOrThrow();

    const media = await prisma.media.findFirst({
      select: { id: true },
      where: { path },
    });

    if (!media) return { success: false, error: "メディアが見つかりません" };

    // バリデーション: 数値がある場合は 1~5 にクランプ
    const validatedRating =
      rating !== null ? Math.max(1, Math.min(5, rating)) : null;

    await upsertFavorite(user.id, media.id, validatedRating);

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

    const media = await prisma.media.findFirst({
      select: { id: true },
      where: { path },
    });

    if (!media) return { success: false, error: "メディアが見つかりません" };

    await deleteFavorite(user.id, media.id);

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

    const media = await prisma.media.findFirst({
      select: { id: true },
      where: { path },
    });

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
