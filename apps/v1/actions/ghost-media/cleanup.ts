"use server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type CleanupGhostMediaResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      deletedCount: number;
    };

// 不要なメディアを削除
export async function cleanupGhostMediaAction(
  ids: string[]
): Promise<CleanupGhostMediaResult> {
  if (!ids || ids.length === 0) {
    return {
      success: false,
      message: "削除対象のメディアIDが指定されていません。",
    };
  }

  let deletedCount: number;
  try {
    const result = await prisma.media.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    deletedCount = result.count;
  } catch (error) {
    logger.error("action:cleanup-ghost-media", error);
    return {
      success: false,
      message: "ゴーストメディアの削除に失敗しました。",
    };
  }

  return {
    success: true,
    deletedCount,
  };
}
