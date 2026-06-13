"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag } from "@/lib/tag/types";
import { unique } from "@/lib/utils/array";
import { generateKana } from "@/lib/utils/kana";
import z from "zod";

const NormalizedNamesSchema = z
  .array(z.string())
  .transform((names) =>
    names.map(normalizeTagName).filter((n): n is string => !!n)
  )
  .transform((names) => unique(names))
  .pipe(z.array(z.string()).min(1, "タグを1件以上指定してください。"));

const InputSchema = z.object({
  names: NormalizedNamesSchema,
});

type ActionResult =
  | { success: true; tags: Tag[] }
  | { success: false; message: string };

// タグ一括作成
export async function createTagsAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { names } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:create-many");
  if (!auth.success) {
    return auth;
  }

  try {
    const existingNames = await getExistingTagNames(names);

    // 未存在のタグのみ、カナを含めてデータ作成
    const toCreateData = await Promise.all(
      names
        .filter((name) => !existingNames.has(name))
        .map(async (name) => ({
          name,
          kana: await generateKana(name),
          isActive: true,
        }))
    );

    if (toCreateData.length > 0) {
      await prisma.tag.createMany({
        data: toCreateData,
        skipDuplicates: true,
      });
    }

    const tags = await prisma.tag.findMany({
      where: { name: { in: names } },
    });

    return { success: true, tags };
  } catch (error) {
    logger.error("action:create-tags", error);
    return { success: false, message: "タグの一括作成に失敗しました" };
  }
}

async function getExistingTagNames(names: string[]): Promise<Set<string>> {
  const existingTags = await prisma.tag.findMany({
    where: { name: { in: names } },
  });

  return new Set(existingTags.map((t) => t.name));
}
