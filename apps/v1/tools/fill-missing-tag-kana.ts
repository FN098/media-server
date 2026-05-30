import { prisma } from "@/lib/db/prisma";
import { generateKana } from "@/lib/utils/kana";

export async function fillMissingTagKana() {
  try {
    // 1. kana が未設定のタグを取得
    const targetTags = await prisma.tag.findMany({
      where: {
        OR: [{ kana: null }, { kana: "" }],
      },
      select: { id: true, name: true },
    });

    if (targetTags.length === 0) {
      return { success: true, message: "更新が必要なタグはありませんでした。" };
    }

    console.log(`${targetTags.length} 件のタグにカナを設定します...`);

    let updatedCount = 0;

    // 2. ループでカナを生成して更新
    for (const tag of targetTags) {
      const generatedKana = await generateKana(tag.name);

      await prisma.tag.update({
        where: { id: tag.id },
        data: { kana: generatedKana },
      });

      updatedCount++;
    }

    return {
      success: true,
      message: `${updatedCount} 件のタグを更新しました。`,
    };
  } catch (error) {
    console.error("Kana generation error:", error);
    return { success: false, error: "カナ更新中にエラーが発生しました。" };
  } finally {
    await prisma.$disconnect();
  }
}

fillMissingTagKana()
  .then((res) => {
    console.log(res);
  })
  .catch(console.error);
