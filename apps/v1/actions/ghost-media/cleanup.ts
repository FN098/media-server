"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "better-auth";

type GhostMediaDeleteResult =
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
): Promise<GhostMediaDeleteResult> {
  if (!ids || ids.length === 0) {
    return {
      success: false,
      message: "削除対象のメディアIDが指定されていません。",
    };
  }

  let deleteResult: { count: number };
  try {
    deleteResult = await prisma.media.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  } catch (error) {
    logger.error("action:cleanup-ghost-media", error);
    return {
      success: false,
      message: "ゴーストメディアの削除に失敗しました。",
    };
  }

  return {
    success: true,
    deletedCount: deleteResult.count,
  };
}
