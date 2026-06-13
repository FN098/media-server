"use server";

import { Tag } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { generateKana } from "@/lib/utils/kana";
import z from "zod";

const InputSchema = z
  .object({
    id: z.uuid(),
    newName: z.string(),
    newKana: z.string().optional(),
  })
  .transform(async ({ id, newName, newKana }) => {
    const normalizedName = normalizeTagName(newName);

    return {
      id,
      newName: normalizedName,
      newKana: newKana ?? (await generateKana(normalizedName)),
    };
  });

type ActionResult =
  | { success: true; tag: Tag }
  | { success: false; message: string };

// タグリネーム
export async function renameTagAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { id, newName, newKana } = parsed.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "tag:rename")) {
    return { success: false, message: "権限がありません。" };
  }

  try {
    const tag = await prisma.tag.update({
      where: { id: id },
      data: {
        name: newName,
        kana: newKana,
      },
    });
    return { success: true, tag };
  } catch (error) {
    logger.error("action:rename-tag", error);
    return { success: false, message: "タグのリネームに失敗しました。" };
  }
}
