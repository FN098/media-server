"use server";

import { Tag } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  id: z.uuid(),
});

type ActionResult =
  | { success: true; tag: Tag }
  | { success: false; message: string };

// タグ削除
export async function deleteTagAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { id } = parsed.data;

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
    const tag = await prisma.tag.delete({
      where: {
        id: id,
      },
    });

    return { success: true, tag };
  } catch (error) {
    logger.error("action:delete-tag", error);
    return { success: false, message: "タグの削除に失敗しました。" };
  }
}
