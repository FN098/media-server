"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { removeFavoriteFiles } from "@/__lib/user-file-favorite/repository";
import { removeFavoriteFolders } from "@/__lib/user-folder-favorite/repository";
import { logger } from "@/lib/logger";
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

export async function removeManyFavoritesAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { entries } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:remove-many");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  const fileIds = entries.filter((e) => !e.isDirectory).map((e) => e.id);
  const folderIds = entries.filter((e) => e.isDirectory).map((e) => e.id);

  try {
    if (fileIds.length > 0) {
      await removeFavoriteFiles({
        userId: user.id,
        fileIds,
      });
    }

    if (folderIds.length > 0) {
      await removeFavoriteFolders({
        userId: user.id,
        folderIds,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("action:remove-many-favorites", error);
    return { success: false, message: "お気に入り一括解除に失敗しました" };
  }
}
