"use server";

import { prisma } from "@/lib/prisma";

// 不要タグスキャン
export async function scanUnusedTagsAction() {
  try {
    // どの MediaTag にも紐付いていないタグを取得
    const unusedTags = await prisma.tag.findMany({
      where: {
        mediaTags: {
          none: {}, // リレーションが空のもの
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { mediaTags: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      tags: unusedTags.map((t) => ({
        id: t.id,
        name: t.name,
        usageCount: t._count.mediaTags,
      })),
    };
  } catch (error) {
    console.error("Scan Unused Tags Error:", error);
    return { success: false, error: "タグのスキャンに失敗しました。" };
  }
}
