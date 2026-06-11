"use server";

import { prisma } from "@/lib/prisma";

type GhostMediaDeleteResult = {
  success: boolean;
  deletedCount?: number;
  error?: string;
};

// 不要なメディアを削除
export async function cleanupGhostMediaAction(
  ids: string[]
): Promise<GhostMediaDeleteResult> {
  if (!ids || ids.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  let deleteResult: { count: number };
  try {
    deleteResult = await prisma.media.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  } catch (error) {
    console.error("Cleanup Ghost Media Error:", error);
    return {
      success: false,
      error: "削除中に予期せぬエラーが発生しました。",
    };
  }

  return {
    success: true,
    deletedCount: deleteResult.count,
  };
}
