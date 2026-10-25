"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { logger } from "@/__lib/logger";
import { getFavoriteFiles } from "@/__lib/user-file-favorite/repository";
import { getFavoriteFolders } from "@/__lib/user-folder-favorite/repository";
import z from "zod";

const InputSchema = z.object({
  entries: z.array(
    z.object({
      id: z.uuid(),
      isDirectory: z.boolean(),
    })
  ),
});

type ActionResult =
  | {
      success: true;
      favoriteFiles: {
        fileId: string;
        isFavorite: boolean;
      }[];
      favoriteFolders: {
        folderId: string;
        isFavorite: boolean;
      }[];
    }
  | {
      success: false;
      message: string;
    };

export async function revalidateManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { entries } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:revalidate-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  const fileIds = entries.filter((e) => !e.isDirectory).map((e) => e.id);

  const folderIds = entries.filter((e) => e.isDirectory).map((e) => e.id);

  try {
    const favoriteFiles =
      fileIds.length > 0
        ? await getFavoriteFiles({ userId: user.id, fileIds })
        : [];

    const favoriteFolders =
      folderIds.length > 0
        ? await getFavoriteFolders({
            userId: user.id,
            folderIds,
          })
        : [];

    return {
      success: true,
      favoriteFiles,
      favoriteFolders,
    };
  } catch (error) {
    logger.error("action:revalidate-many-favorites", error);
    return { success: false, message: "お気に入り一括再検証に失敗しました" };
  }
}
