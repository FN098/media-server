"use server";

import { prisma } from "@/lib/db/prisma";
import {
  GhostMediaDeleteResult,
  GhostMediaItem,
  GhostMediaScanOptions,
} from "@/lib/ghost-media/types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { constants } from "fs";
import { access } from "fs/promises";

/**
 * 不要なメディアをスキャン
 * @deprecated 進捗確認できないので非推奨。代わりに /api/ghost/media/scan を推奨
 */
export async function scanGhostMediaAction(options?: GhostMediaScanOptions) {
  try {
    const isFullScan = options?.fullScan ?? false;
    const ghostItems: GhostMediaItem[] = [];

    if (isFullScan) {
      // フルスキャン：ファイル単位で実体を確認
      const allMedia = await prisma.media.findMany({
        select: { id: true, title: true, path: true, dirPath: true },
      });

      for (const item of allMedia) {
        const realPath = getServerMediaPath(item.path);
        try {
          await access(realPath, constants.F_OK);
        } catch {
          ghostItems.push({
            id: item.id,
            title: item.title,
            path: item.path,
          });
        }
      }
    } else {
      // クイックスキャン：フォルダ単位で実体を確認
      const folders = await prisma.media.groupBy({
        by: ["dirPath"],
      });

      const missingDirPaths: string[] = [];
      for (const folder of folders) {
        const realPath = getServerMediaPath(folder.dirPath);
        try {
          await access(realPath, constants.F_OK);
        } catch {
          missingDirPaths.push(folder.dirPath);
        }
      }

      if (missingDirPaths.length > 0) {
        const items = await prisma.media.findMany({
          where: { dirPath: { in: missingDirPaths } },
          select: { id: true, title: true, path: true },
        });
        ghostItems.push(...items);
      }
    }

    return {
      success: true,
      items: ghostItems,
    };
  } catch (error) {
    console.error("Scan Ghost Media Error:", error);
    return { success: false, error: "スキャン中にエラーが発生しました。" };
  }
}

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
