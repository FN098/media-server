"use server";

import { prisma } from "@/lib/prisma";

// タグ削除
export async function deleteTagAction(id: string) {
  try {
    const tag = await prisma.tag.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      tag,
      message: `タグ「${tag.name}」を削除しました。`,
    };
  } catch (error) {
    console.error("Delete Tag Error:", error);
    return {
      success: false,
      error: "タグの削除に失敗しました。既に削除されている可能性があります。",
    };
  }
}
