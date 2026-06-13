"use server";

import { authorize } from "@/lib/authorization/authorize";
import { deleteManyFavorites } from "@/lib/favorite/repository";
import { logger } from "@/lib/logger";
import { getMediaIdsByPaths } from "@/lib/media/repository";
import { unique } from "@/lib/utils/array";
import { EditableVirtualPathManySchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  paths: EditableVirtualPathManySchema.min(
    1,
    "ファイルまたはフォルダを1件以上指定してください。"
  ).transform((paths) => unique(paths)),
});

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// 一括お気に入り削除
export async function deleteManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { paths } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:delete-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(paths);

  const mediaIds = Object.values(mediaMap);
  if (mediaIds.length === 0) {
    return {
      success: false,
      message: "お気に入り削除対象のメディアがありません。",
    };
  }

  try {
    await deleteManyFavorites({ userId: user.id, mediaIds });
    return { success: true };
  } catch (error) {
    logger.error("action:delete-multiple-favorites", error);
    return { success: false, message: "お気に入り一括解除に失敗しました" };
  }
}
