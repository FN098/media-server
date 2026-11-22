"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { removeFavoriteFiles } from "@/lib/user-file-favorite/repository";
import { removeFavoriteFolders } from "@/lib/user-folder-favorite/repository";
import z from "zod";

const inputSchema = z.object({
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
  input: z.input<typeof inputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { entries } = parsed.data;

  // 認証＋認可
  const auth = await authorize("remove-many-favorites");
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
    logger.error("remove-many-favorites-action", error);
    return { success: false, message: "お気に入り一括解除に失敗しました" };
  }
}
