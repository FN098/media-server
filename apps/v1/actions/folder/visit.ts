"use server";

import { authorize } from "@/lib/authorization/authorize";
import { updateVisitedFolder } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  dirPath: EditableVirtualPathSchema,
});

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// フォルダ訪問履歴更新
export async function visitFolderAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { dirPath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("folder:update-visited");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    await updateVisitedFolder(dirPath, user.id);
  } catch (error) {
    logger.error("action:update-folder-history", error);
    return {
      success: false,
      message: "訪問済みフォルダの更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
