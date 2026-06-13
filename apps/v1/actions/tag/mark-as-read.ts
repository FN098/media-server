"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  ids: z.array(z.uuid()),
});

type ActionResult = { success: true } | { success: false; message: string };

// タグ既読チェック
export async function markTagsAsReadAction(
  ids: string[]
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse({ ids });
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const normalizedIds = parsed.data.ids;
  if (normalizedIds.length === 0) {
    return { success: false, message: "既読対象のタグがありません。" };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "tag:mark-as-read")) {
    return { success: false, message: "権限がありません。" };
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
    logger.error("action:mark-tag-as-read", error);
    return { success: false, message: "タグの更新に失敗しました。" };
  }
}
