"use server";

import { authorize } from "@/lib/authorization/authorize";
import { deleteFavorite } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdByPath } from "@/lib/media/repository";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  path: EditableVirtualPathSchema,
});

type DeleteFavoriteResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// お気に入り削除 (レコード自体の消去)
export async function deleteFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<DeleteFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { path } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:delete");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // メディアID逆引き
  const mediaId = await getMediaIdByPath(path);
  if (!mediaId) return { success: false, message: "メディアが見つかりません" };

  try {
    await deleteFavorite({ userId: user.id, mediaId });
    return { success: true };
  } catch (error) {
    logger.error("action:delete-favorite", error);
    return { success: false, message: "お気に入り解除に失敗しました" };
  }
}
