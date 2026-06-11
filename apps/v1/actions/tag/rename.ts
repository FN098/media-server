"use server";

import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/tag/normalize";
import { generateKana } from "@/lib/utils/kana";

// タグリネーム
export async function renameTagAction(
  id: string,
  newName: string,
  newKana?: string
) {
  try {
    const normalizedName = normalizeTagName(newName);
    if (!normalizedName) throw new Error("Invalid name");

    const kana = newKana || (await generateKana(normalizedName));

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: normalizedName,
        kana, // 名前が変わったら読みも更新
      },
    });
    return { success: true, tag };
  } catch (error) {
    console.error("Rename Tag Error:", error);
    return { success: false, error: "タグの名前変更に失敗しました。" };
  }
}
