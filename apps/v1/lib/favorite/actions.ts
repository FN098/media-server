"use server";

import { USER } from "@/basic-auth";
import {
  createFavorite,
  deleteFavorite,
  isFavorite,
} from "@/lib/favorite/repository";
import { findMediaByPath } from "@/lib/media/repository";
import { findUserById } from "@/lib/user/repository";
import { revalidatePath } from "next/cache";

type UpdateFavoriteResult = {
  message: string;
  ok: boolean;
};

export async function updateFavorite(
  path: string
): Promise<UpdateFavoriteResult> {
  try {
    // TODO: ユーザー認証機能実装後に差し替える
    const user = await findUserById(USER);
    if (!user) return { message: "unauthorized", ok: false };

    const media = await findMediaByPath(path);
    if (!media) return { message: "not found", ok: false };

    const favorite = await isFavorite(user.id, media.id);
    if (favorite) {
      await deleteFavorite(user.id, media.id);
    } else {
      await createFavorite(user.id, media.id);
    }

    // お気に入りページのキャッシュ削除
    revalidatePath("/favorites");

    return { message: "success", ok: true };
  } catch (e) {
    console.error(e);
    return { message: "failed", ok: false };
  }
}

type RevalidateFavoriteResult =
  | {
      message: string;
      ok: false;
    }
  | {
      value: boolean;
      ok: true;
    };

export async function revalidateFavorite(
  path: string
): Promise<RevalidateFavoriteResult> {
  try {
    // TODO: ユーザー認証機能実装後に差し替える
    const user = await findUserById(USER);
    if (!user) return { message: "unauthorized", ok: false };

    const media = await findMediaByPath(path);
    if (!media) return { message: "not found", ok: false };

    const favorite = await isFavorite(user.id, media.id);

    return { value: favorite, ok: true };
  } catch (e) {
    console.error(e);
    return { message: "failed", ok: false };
  }
}
