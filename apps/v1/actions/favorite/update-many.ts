"use server";

import { authorize } from "@/lib/authorization/authorize";
import { upsertManyFavorites } from "@/lib/favorite/repository";
import { RatingInputSchema } from "@/lib/favorite/schemas";
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

// 一括お気に入り登録・更新
export async function updateManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { paths, rating } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:update-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  // メディアID逆引き
  const mediaMap = await getMediaIdsByPaths(paths);

  // 有効なデータのみを抽出して整形
  const dataToUpsert = paths
    .map((path) => {
      const mediaId = mediaMap[path];
      if (!mediaId) return null;
      return { userId: user.id, mediaId };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (dataToUpsert.length === 0) {
    return {
      success: false,
      message: "お気に入り更新対象のメディアがありません。",
    };
  }

  try {
    await upsertManyFavorites({
      data: dataToUpsert,
      rating: rating,
    });
    return { success: true };
  } catch (error) {
    logger.error("action:update-multiple-favorites", error);
    return { success: false, message: "お気に入り一括更新に失敗しました" };
  }
}
