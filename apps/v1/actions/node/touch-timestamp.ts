"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { updateMediaFileMtime } from "@/lib/media/repository";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  sourcePath: EditableVirtualPathSchema,
});

type ActionResult = { success: true } | { success: false; message: string };

// タイムスタンプ更新
export async function touchMediaTimestampAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:touch-timestamp");
  if (!auth.success) {
    return auth;
  }

  const srcVirtualPath = sourcePath;

  // FS 更新不要：タイムスタンプは utime や open->close では更新されないため

  // DB 更新
  try {
    await updateMediaFileMtime({ path: srcVirtualPath });
  } catch (e) {
    logger.error("action:touch-timestamp", e);
    return {
      success: false,
      message: "タイムスタンプの更新に失敗しました。",
    };
  }

  return { success: true };
}
