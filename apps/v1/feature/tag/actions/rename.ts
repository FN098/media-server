"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag } from "@/lib/tag/types";
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
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { id, newName, newKana } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:rename");
  if (!auth.success) {
    return auth;
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
