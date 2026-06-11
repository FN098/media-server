"use server";

import { prisma } from "@/lib/prisma";

// タグ一括削除
export async function deleteMultipleTagsAction(ids: string[]) {
  try {
    if (ids.length === 0) return { success: true, deletedCount: 0 };

    const deleteResult = await prisma.tag.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    console.error("Delete Tags Error:", error);
    return { success: false, error: "タグの削除中にエラーが発生しました。" };
  }
}
