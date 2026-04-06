"use server";

import { resolveCurrentUser } from "@/lib/auth/resolver";
import {
  createFavorite,
  deleteFavorite,
  isFavorite,
} from "@/repositories/favorite-repository";
import { findMediaByPath } from "@/repositories/media-repository";

export async function updateFavorite(path: string) {
  try {
    const user = await resolveCurrentUser();
    const userId = user.id;

    const media = await findMediaByPath(path);
    if (!media) return { success: false, error: "メディアがありません" };

    const favorite = await isFavorite(userId, media.id);
    if (favorite) {
      await deleteFavorite(userId, media.id);
    } else {
      await createFavorite(userId, media.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return { success: false, error: "お気に入りの更新に失敗しました" };
  }
}

export async function revalidateFavorite(path: string) {
  try {
    const user = await resolveCurrentUser();
    const userId = user.id;

    const media = await findMediaByPath(path);
    if (!media) return { success: false, error: "メディアがありません" };

    const favorite = await isFavorite(userId, media.id);
    return { favorite, success: true };
  } catch (error) {
    console.error("Failed to revalidate favorite:", error);
    return { success: false, error: "お気に入りの再検証に失敗しました" };
  }
}
