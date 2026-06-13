"use server";

import { authorize } from "@/lib/authorization/authorize";
import { togglePinVisitedFolder } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  dirPath: EditableVirtualPathSchema,
  currentPinned: z.boolean(),
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

// フォルダ訪問履歴ピン留めトグル
export async function togglePinVisitedFolderAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { dirPath, currentPinned } = parsed.data;

  // 認証＋認可
  const auth = await authorize("folder:pin-visited");
  if (!auth.success) {
    return auth;
  }
  const { user } = auth;

  try {
    await togglePinVisitedFolder(user.id, dirPath, currentPinned);
  } catch (error) {
    logger.error("action:toggle-pin-visited-folder", error);
    return {
      success: false,
      message: "フォルダ訪問履歴ピン留め更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
