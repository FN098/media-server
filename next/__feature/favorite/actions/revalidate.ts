"use server";

import { isFavoriteFile } from "@/__lib/user-file-favorite/repository";
import { isFavoriteFolder } from "@/__lib/user-folder-favorite/repository";
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
      isFavorite: boolean;
    }
  | {
      success: false;
      message: string;
    };

// お気に入り再検証
export async function revalidateFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id, isDirectory } = parsed.data;

  // 認証＋認可
  const auth = await authorize("favorite:revalidate");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    if (isDirectory) {
      const isFavorite = await isFavoriteFolder({
        userId: user.id,
        folderId: id,
      });
      return { success: true, isFavorite };
    } else {
      const isFavorite = await isFavoriteFile({ userId: user.id, fileId: id });
      return { success: true, isFavorite };
    }
  } catch (error) {
    logger.error("action:revalidate-favorite", error);
    return { success: false, message: "お気に入り再検証に失敗しました" };
  }
}
