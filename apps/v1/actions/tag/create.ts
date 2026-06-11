"use server";

import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag } from "@/lib/tag/types";
import { generateKana } from "@/lib/utils/kana";

type CreateTagsResult =
  | {
      success: true;
      tags: Tag[];
    }
  | {
      success: false;
      error: string;
    };

// タグ一括作成
export async function createTagsAction(
  names: string[]
): Promise<CreateTagsResult> {
  try {
    const normalizedNames = Array.from(
      new Set(names.map(normalizeTagName).filter((n): n is string => !!n))
    );

    if (normalizedNames.length === 0) {
      return { success: true, tags: [] };
    }

    const existingTags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    const existingNames = new Set(existingTags.map((t) => t.name));

    // 未存在のタグのみ、カナを含めてデータ作成
    const toCreate = await Promise.all(
      normalizedNames
        .filter((name) => !existingNames.has(name))
        .map(async (name) => ({
          name,
          kana: await generateKana(name),
          isActive: true,
        }))
    );

    if (toCreate.length > 0) {
      await prisma.tag.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    const tags = await prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    return { success: true, tags };
  } catch (error) {
    console.error("Create tags error:", error);
    return { success: false, error: "タグの作成に失敗しました" };
  }
}
