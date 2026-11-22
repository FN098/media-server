"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { removeFavoriteFile } from "@/lib/user-file-favorite/repository";
import { removeFavoriteFolder } from "@/lib/user-folder-favorite/repository";
import z from "zod";

const inputSchema = z.object({
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

export async function removeFavoriteAction(
  input: z.input<typeof inputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id, isDirectory } = parsed.data;

  // 認証＋認可
  const auth = await authorize("remove-favorite");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    if (isDirectory) {
      await removeFavoriteFolder({
        userId: user.id,
        folderId: id,
      });
    } else {
      await removeFavoriteFile({
        userId: user.id,
        fileId: id,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("remove-favorite-action", error);
    return { success: false, message: "お気に入り解除に失敗しました" };
  }
}
