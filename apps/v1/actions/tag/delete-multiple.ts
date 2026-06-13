"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  ids: z.array(z.uuid()),
});

type ActionResult =
  | { success: true; deletedCount: number }
  | { success: false; message: string };

// タグ一括削除
export async function deleteMultipleTagsAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { ids } = parsed.data;
  if (ids.length === 0) {
    return { success: false, message: "削除対象のタグがありません。" };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "tag:delete")) {
    return { success: false, message: "権限がありません。" };
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
    logger.error("action:delete-tags", error);
    return { success: false, message: "タグの削除に失敗しました。" };
  }
}
