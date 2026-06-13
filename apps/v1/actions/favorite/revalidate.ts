"use server";

import { authorize } from "@/lib/authorization/authorize";
import { getFavorite } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  path: EditableVirtualPathSchema,
});

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
    };

// お気に入り再検証
export async function revalidateFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<RevalidateFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { path } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:revalidate");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(path);
  if (!mediaId) return { success: false, message: "メディアが見つかりません" };

  try {
    const favorite = await getFavorite({ userId: user.id, mediaId });

    // お気に入り未登録の場合は成功扱いとする
    if (!favorite) return { success: true, favorite: null };

    return {
      success: true,
      favorite: {
        path: path,
        rating: favorite.rating,
      },
    };
  } catch (error) {
    logger.error("action:revalidate-favorite", error);
    return { success: false, message: "お気に入り再検証に失敗しました" };
  }
}
