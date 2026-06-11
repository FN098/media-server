"use server";

import { GhostThumbItem } from "@/lib/ghost-thumb/types";
import { PATHS } from "@/lib/path/paths";
import { rm } from "fs/promises";
import path from "path";

// 不要サムネイル削除
export async function cleanupGhostThumbnailsAction(items: GhostThumbItem[]) {
  try {
    const thumbRoot = path.resolve(PATHS.server.media.thumb.root);
    let deletedCount = 0;

    // メモリ保護のためバッチ処理
    const CHUNK_SIZE = 50;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (item) => {
          // 安全確認: thumbRoot配下であること
          if (!item.path.startsWith(thumbRoot)) return;

          try {
            if (item.isDirectory) {
              // ディレクトリごと一撃で消去
              await rm(item.path, { recursive: true, force: true });
            } else {
              // 個別ファイルの消去
              await rm(item.path, { force: true });
            }
            deletedCount++;
          } catch (e) {
            console.error(`Failed to delete: ${item.path}`, e);
          }
        })
      );
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Cleanup Error:", error);
    return { success: false, error: "削除中にエラーが発生しました。" };
  }
}
