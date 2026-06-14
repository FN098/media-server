"use server";

import { authorize } from "@/lib/authorization/authorize";
import { upsertFavorite } from "@/lib/favorite/repository";
import { RatingInputSchema } from "@/lib/favorite/schemas";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  path: EditableVirtualPathSchema,
  rating: RatingInputSchema,
});

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// お気に入りレーティング更新
export async function updateFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { path, rating } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:update");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(path);
  if (!mediaId)
    return { success: false, message: "メディアが見つかりません。" };

  try {
    await upsertFavorite({
      userId: user.id,
      mediaId,
      rating: rating,
    });
  } catch (error) {
    logger.error("action:update-favorite", error);
    return { success: false, message: "お気に入りの更新に失敗しました。" };
  }

  return { success: true };
}
