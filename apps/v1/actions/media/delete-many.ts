"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  ids: z.array(z.uuid()).min(1, "メディアを1件以上指定してください。"),
});

type ActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      deletedCount: number;
    };

// メディア一括削除
export async function deleteManyMediaAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { ids } = parsed.data;

  // 認証＋認可
  const auth = await authorize("media:delete-many");
  if (!auth.success) {
    return auth;
  }

  let deletedCount: number;
  try {
    const result = await prisma.media.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    deletedCount = result.count;
  } catch (error) {
    logger.error("action:delete-many-media", error);
    return {
      success: false,
      message: "メディアの一括削除に失敗しました。",
    };
  }

  return {
    success: true,
    deletedCount,
  };
}
