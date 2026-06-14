"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  ids: z.array(z.uuid()).min(1, "タグを1件以上指定してください。"),
});

type ActionResult =
  | { success: true; deletedCount: number }
  | { success: false; message: string };

// タグ一括削除
export async function deleteManyTagsAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { ids } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:delete-many");
  if (!auth.success) {
    return auth;
  }

  try {
    const result = await prisma.tag.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  } catch (error) {
    logger.error("action:delete-many-tags", error);
    return { success: false, message: "タグの一括削除に失敗しました。" };
  }
}
