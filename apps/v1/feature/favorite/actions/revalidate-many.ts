"use server";

import { authorize } from "@/lib/authorization/authorize";
import { getManyFavorites } from "@/lib/favorite/repository";
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
      favorites: {
        path: string;
        rating: number | null;
      }[];
    }
  | {
      success: false;
      message: string;
    };

// 一括お気に入り再検証
export async function revalidateManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { paths } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:revalidate-many");
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
      message: "お気に入り再検証対象のメディアがありません。",
    };
  }

  try {
    const favorites = await getManyFavorites({ userId: user.id, mediaIds });

    return {
      success: true,
      favorites: favorites.map((f) => ({ path: f.path, rating: f.rating })),
    };
  } catch (error) {
    logger.error("action:revalidate-many-favorites", error);
    return { success: false, message: "お気に入り一括再検証に失敗しました" };
  }
}
