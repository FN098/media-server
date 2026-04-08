import { prisma } from "@/lib/prisma";
import { generateKana } from "@/lib/utils/kana";

/**
 * ひらがなをカタカナに変換する補助関数
 */
function toFullWidthKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

export async function fixAndFillTagKana() {
  try {
    // 1. カナが空、または「ひらがな」が含まれているデータを取得
    // Prismaの正規表現（matches）が使えない場合を想定し、一旦全件取得してJS側で判定
    const allTags = await prisma.tag.findMany({
      select: { id: true, name: true, kana: true },
    });

    const targetTags = allTags.filter((tag) => {
      const isMissing = !tag.kana || tag.kana.trim() === "";
      const hasHiragana = tag.kana && /[\u3041-\u3096]/.test(tag.kana);
      return isMissing || hasHiragana;
    });

    if (targetTags.length === 0) {
      return { success: true, message: "修正が必要なタグはありませんでした。" };
    }

    console.log(`${targetTags.length} 件のタグを処理します...`);

    let updatedCount = 0;

    for (const tag of targetTags) {
      let finalKana = "";

      // カナが完全に空の場合は新規生成
      if (!tag.kana || tag.kana.trim() === "") {
        const rawKana = await generateKana(tag.name);
        finalKana = toFullWidthKatakana(rawKana);
      } else {
        // すでにカナはあるがひらがな混じりの場合は変換のみ
        finalKana = toFullWidthKatakana(tag.kana);
      }

      await prisma.tag.update({
        where: { id: tag.id },
        data: { kana: finalKana },
      });

      updatedCount++;
    }

    return {
      success: true,
      message: `${updatedCount} 件のタグを修正・更新しました。`,
    };
  } catch (error) {
    console.error("Operation failed:", error);
    return { success: false, error: "更新中にエラーが発生しました。" };
  } finally {
    await prisma.$disconnect();
  }
}

fixAndFillTagKana()
  .then((res) => console.log(res))
  .catch(console.error);
