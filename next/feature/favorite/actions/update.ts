"use server";

import { authorize } from "@/lib/authorization/authorize";
import { upsertFileFavorite } from "@/lib/file/repository";
import { upsertFolderFavorite } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import z from "zod";

const InputSchema = z.object({
  id: z.uuid(),
  isDirectory: z.boolean(),
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

  const { id, isDirectory } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:update");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    if (isDirectory) {
      await upsertFolderFavorite({
        userId: user.id,
        folderId: id,
      });
    } else {
      await upsertFileFavorite({
        userId: user.id,
        fileId: id,
      });
    }
  } catch (error) {
    logger.error("action:update-favorite", error);
    return { success: false, message: "お気に入りの更新に失敗しました。" };
  }

  return { success: true };
}
