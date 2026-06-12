"use server";

import { logger } from "@/lib/logger";
import { PATHS } from "@/lib/path/paths";
import { chunk } from "@/lib/utils/array";
import { rm } from "fs/promises";
import path from "path";

type CleanupGhostThumbnailsResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      deletedCount: number;
    };

// 不要サムネイル削除
export async function cleanupGhostThumbnailsAction(
  items: { path: string }[]
): Promise<CleanupGhostThumbnailsResult> {
  if (!items || items.length === 0) {
    return {
      success: false,
      message: "削除対象のメディアIDが指定されていません。",
    };
  }

  const thumbRoot = path.resolve(PATHS.server.media.thumb.root);

  const chunks = chunk(
    items.map((n) => n.path),
    50 // 並列処理数
  );

  let deletedCount = 0;

  try {
    for (const paths of chunks) {
      await Promise.all(
        paths.map(async (path) => {
          // 安全確認: thumbRoot配下であること
          if (!path.startsWith(thumbRoot)) return;

          try {
            await rm(path, { recursive: true, force: true });
          } catch (e) {
            logger.error("action:cleanup-ghost-thumb", e);
            return;
          }

          deletedCount++;
        })
      );
    }
  } catch (error) {
    logger.error("action:cleanup-ghost-thumb", error);
    return {
      success: false,
      message: "ゴーストサムネイルの削除に失敗しました。",
    };
  }

  return { success: true, deletedCount };
}
