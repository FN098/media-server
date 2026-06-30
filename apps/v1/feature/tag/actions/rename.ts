"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag } from "@/lib/tag/types";
import { generateKana } from "@/lib/utils/kana";
import z from "zod";

const InputSchema = z.object({
  id: z.uuid(),
  newName: z.string(),
  newKana: z.string().optional(),
});

type ActionResult =
  | { success: true; tag: Tag }
  | { success: false; message: string };

// タグリネーム
export async function renameTagAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  // 正規化
  const id = parsed.data.id;
  const newName = normalizeTagName(parsed.data.newName);
  const newKana = parsed.data.newKana ?? (await generateKana(newName));

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
