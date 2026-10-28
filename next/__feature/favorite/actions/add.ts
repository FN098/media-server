"use server";

import { addFavoriteFile } from "@/__lib/user-file-favorite/repository";
import { addFavoriteFolder } from "@/__lib/user-folder-favorite/repository";
import { authorize } from "@/lib/authorization/authorize";
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

export async function addFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id, isDirectory } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:add");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    if (isDirectory) {
      await addFavoriteFolder({
        userId: user.id,
        folderId: id,
      });
    } else {
      await addFavoriteFile({
        userId: user.id,
        fileId: id,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("action:add-favorite", error);
    return { success: false, message: "お気に入りの更新に失敗しました。" };
  }
}
