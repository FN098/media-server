import { AbortError, isAbortError } from "@/lib/errors/abort-error";
import {
  GhostMediaItem,
  GhostMediaScanEventData,
} from "@/lib/ghost-media/types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { db } from "@/lib/prisma";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { access, constants } from "fs/promises";

const MAX_SCAN_ITEMS = 10000;

export function scanGhostMedia(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal,
  fullScan: boolean
) {
  if (fullScan) {
    return runFullScan(send, signal);
  } else {
    return runQuickScan(send, signal);
  }
}

// フルスキャン (ファイル単位)
async function runFullScan(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal
): Promise<GhostMediaItem[]> {
  const ghostItems: GhostMediaItem[] = [];

  // FIXME: ファイル件数が多いとメモリを圧迫する。今のところは問題になっていないので、そのうち対応する
  // DB 上の全ファイルを取得
  const allMedia = await db.media.findMany({
    select: {
      id: true,
      title: true,
      path: true,
    },
  });

  const total = allMedia.length;
  if (total === 0) return [];

  const batchSize = 30;

  try {
    for (let i = 0; i < total; i += batchSize) {
      if (signal.aborted) throw new AbortError();

      const batch = allMedia.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (item) => {
          if (signal.aborted) throw new AbortError();

          const realPath = getServerMediaPath(item.path);

          try {
            await access(realPath, constants.F_OK);
            return null;
          } catch (e) {
            // ENOENT 以外の場合は処理中断
            if (!isFsNotFoundError(e)) throw e;

            return { ...item } satisfies GhostMediaItem;
          }
        })
      );

      ghostItems.push(...results.filter((item) => item != null));

      send({
        type: "progress",
        current: Math.min(i + batchSize, total),
        total,
        found: ghostItems.length,
      });

      // しきい値を超える件数を検出したら終了
      if (ghostItems.length > MAX_SCAN_ITEMS) throw new AbortError();
    }
  } catch (e) {
    if (isAbortError(e)) {
      return ghostItems;
    }

    // AbortError 以外の場合はエスカレーション
    throw e;
  }

  return ghostItems;
}

// 高速スキャン (フォルダ単位)
async function runQuickScan(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal
): Promise<GhostMediaItem[]> {
  const ghostItems: GhostMediaItem[] = [];

  // dirPath の一覧（UNIQUE）を取得
  const allFolders = await db.media.findMany({
    distinct: ["dirPath"],
    select: {
      dirPath: true,
    },
  });

  const total = allFolders.length;
  if (total === 0) return [];

  const batchSize = 30;

  try {
    for (let i = 0; i < total; i += batchSize) {
      if (signal.aborted) throw new AbortError();

      const batch = allFolders.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (item) => {
          if (signal.aborted) throw new AbortError();

          const realPath = getServerMediaPath(item.dirPath);

          try {
            await access(realPath, constants.F_OK);
            return null;
          } catch (e) {
            // ENOENT 以外の場合は処理中断
            if (!isFsNotFoundError(e)) throw e;

            return item.dirPath;
          }
        })
      );

      const missingDirs = results.filter((dir): dir is string => dir != null);

      // フォルダがなければ、そのフォルダ配下のファイルをゴーストとして追加
      if (missingDirs.length > 0) {
        const items = await db.media.findMany({
          where: { dirPath: { in: missingDirs } },
          select: { id: true, title: true, path: true },
        });

        ghostItems.push(...items);
      }

      send({
        type: "progress",
        current: Math.min(i + batchSize, total),
        total,
        found: ghostItems.length,
      });

      // しきい値を超える件数を検出したら終了
      if (ghostItems.length > MAX_SCAN_ITEMS) throw new AbortError();
    }
  } catch (e) {
    if (isAbortError(e)) {
      return ghostItems;
    }

    // AbortError 以外の場合はエスカレーション
    throw e;
  }

  return ghostItems;
}
