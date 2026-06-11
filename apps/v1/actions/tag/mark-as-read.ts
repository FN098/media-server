"use server";

import { prisma } from "@/lib/prisma";

// タグ既読チェック
export async function markTagsAsReadAction(ids: string[]) {
  try {
    if (ids.length === 0) return { success: true };

    await prisma.tag.updateMany({
      where: {
        id: { in: ids },
        isNew: true, // 念のため新規のものだけに限定
        isActive: true,
      },
      data: {
        isNew: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Mark Tags As Read Error:", error);
    return { success: false, error: "タグの更新に失敗しました。" };
  }
}
