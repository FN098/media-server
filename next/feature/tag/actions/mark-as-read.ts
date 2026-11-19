"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  ids: z.array(z.uuid()).min(1, "タグを1件以上指定してください。"),
});

type ActionResult = { success: true } | { success: false; message: string };

// タグ既読チェック
export async function markTagsAsReadAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { ids } = parsed.data;

  // 認証＋認可
  const auth = await authorize("mark-tag-as-read");
  if (!auth.success) {
    return auth;
  }

  try {
    await prisma.tag.updateMany({
      where: {
        id: { in: ids },
        isNew: true, // 念のため新規のものだけに限定
        isActive: true,
      },
      data: {
        isNew: false,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("mark-tag-as-read-action", error);
    return { success: false, message: "タグの既読更新に失敗しました。" };
  }
}
