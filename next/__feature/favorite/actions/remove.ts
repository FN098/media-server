"use server";

import { removeFavoriteFile } from "@/__lib/user-file-favorite/repository";
import { removeFavoriteFolder } from "@/__lib/user-folder-favorite/repository";
import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import z from "zod";

const InputSchema = z.object({
  id: z.uuid(),
  isDirectory: z.boolean(),
});

type RemoveFavoriteResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export async function removeFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<RemoveFavoriteResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id, isDirectory } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:remove");
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
    logger.error("action:remove-favorite", error);
    return { success: false, message: "お気に入り解除に失敗しました" };
  }
}
