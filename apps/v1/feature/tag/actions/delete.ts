"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/lib/tag/types";
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
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:delete");
  if (!auth.success) {
    return auth;
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
