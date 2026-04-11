"use server";

import { APP_CONFIG } from "@/app.config";
import { getMediaPathFromThumbPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { GhostThumbItem, GhostThumbScanOptions } from "@/lib/thumb/types";
import { hashPath } from "@/lib/utils/path";
import { connection, thumbQueue } from "@/workers/thumb/queue";
import { rm } from "fs/promises";
import { glob } from "glob";
import path from "path";

const LOCK_TTL = 1000 * 60 * 10; // 10分

async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
  // key: lockKey
  // value: 1 (any)
  // PX: milli-second EXpire (ttl)
  // LOCK_TTL: milli-seconds
  // NX: Not eXists (set only if not exists)
  const res = await connection.set(key, "1", "PX", ttlMs, "NX");
  return res === "OK";
}

export async function enqueueThumbJobAction(
  dirPath: string,
  forceCreate = false
) {
  const lockKey = `thumb-lock:dir:${hashPath(dirPath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return;
  }

  await thumbQueue.add(
    "create-thumbs",
    {
      dirPath,
      createdAt: Date.now(),
      lockKey,
      forceCreate,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    }
  );
}

export async function enqueueSingleThumbJobAction(
  filePath: string,
  forceCreate = false
) {
  const lockKey = `thumb-lock:dir:${hashPath(filePath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return;
  }

  await thumbQueue.add(
    "create-thumb-single",
    {
      filePath,
      createdAt: Date.now(),
      lockKey,
      forceCreate,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    }
  );
}

/**
 * 不要なサムネイル（DBに紐づかないファイル）をスキャン
 * @deprecated 進捗確認できないので非推奨。代わりに /api/ghost/thumb/scan を推奨
 */
export async function scanGhostThumbnailsAction(
  options?: GhostThumbScanOptions
) {
  try {
    const isFullScan = options?.fullScan ?? false;
    const thumbRoot = PATHS.server.media.thumb.root;
    const ghostThumbnails: string[] = [];

    if (isFullScan) {
      // --- フルスキャン: 全ファイルをDBと照合 ---
      // サムネイルフォルダ内の全ファイルを再帰的に取得
      const allThumbFiles = await glob("**/*" + APP_CONFIG.thumb.extension, {
        cwd: thumbRoot,
        absolute: true,
        nodir: true,
      });

      // DBにある全パスをSetで取得（高速比較用）
      const allMedia = await prisma.media.findMany({ select: { path: true } });
      const validMediaPaths = new Set(allMedia.map((m) => m.path));

      for (const fullPath of allThumbFiles) {
        const mediaPath = getMediaPathFromThumbPath(fullPath);
        if (!validMediaPaths.has(mediaPath)) {
          ghostThumbnails.push(fullPath);
        }
      }
    } else {
      // --- 高速スキャン: フォルダ単位で照合 ---
      // サムネイルルートにある「ディレクトリ」を走査
      const thumbDirs = await glob("**/", { cwd: thumbRoot, absolute: true });

      // DBに存在する dirPath の一覧を取得
      const folders = await prisma.media.groupBy({ by: ["dirPath"] });
      const validDirPaths = new Set(folders.map((f) => f.dirPath));

      for (const fullDirPath of thumbDirs) {
        // ルートパス自体はスキップ
        if (fullDirPath === thumbRoot || fullDirPath === thumbRoot + path.sep)
          continue;

        // サムネイルのフルパスからDB上の dirPath 相当を計算
        let relativeDirPath = fullDirPath
          .replace(thumbRoot, "")
          .replace(/\\/g, "/") // Windowsパス対応
          .replace(/\/$/, ""); // 末尾スラッシュ削除

        if (relativeDirPath.startsWith("/"))
          relativeDirPath = relativeDirPath.substring(1);

        // そのディレクトリ配下にレコードが1つもなければ、その中のファイルは全てゴースト候補
        if (!validDirPaths.has(relativeDirPath)) {
          const filesInBadDir = await glob(
            "**/*" + APP_CONFIG.thumb.extension,
            {
              cwd: fullDirPath,
              absolute: true,
              nodir: true,
            }
          );
          ghostThumbnails.push(...filesInBadDir);
        }
      }
    }

    return {
      success: true,
      items: ghostThumbnails, // 削除時に使うための絶対パスリスト
    };
  } catch (error) {
    console.error("Scan Ghost Thumbnails Error:", error);
    return { success: false, error: "スキャン中にエラーが発生しました。" };
  }
}

/**
 * 不要なサムネイルファイルの物理削除
 */
export async function cleanupGhostThumbnailsAction(items: GhostThumbItem[]) {
  try {
    const thumbRoot = PATHS.server.media.thumb.root;
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
