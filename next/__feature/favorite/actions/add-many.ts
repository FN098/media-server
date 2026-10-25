"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { logger } from "@/__lib/logger";
import { addFavoriteFiles } from "@/__lib/user-file-favorite/repository";
import { addFavoriteFolders } from "@/__lib/user-folder-favorite/repository";
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
    }
  | {
      success: false;
      message: string;
    };

export async function addManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { entries } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:add-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  const fileIds = entries.filter((e) => !e.isDirectory).map((e) => e.id);
  const folderIds = entries.filter((e) => e.isDirectory).map((e) => e.id);

  try {
    if (fileIds.length > 0) {
      await addFavoriteFiles({
        userId: user.id,
        fileIds,
      });
    }

    if (folderIds.length > 0) {
      await addFavoriteFolders({
        userId: user.id,
        folderIds,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("action:add-many-favorites", error);
    return { success: false, message: "お気に入り一括更新に失敗しました" };
  }
}
