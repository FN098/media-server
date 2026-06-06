import { AbortError, isAbortError } from "@/lib/errors/abort-error";
import {
  GhostMediaItem,
  GhostMediaScanEventData,
} from "@/lib/ghost-media/types";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { access, constants } from "fs/promises";
import { NextRequest } from "next/server";

// TODO: ユーザー認証・認可追加

const MAX_GHOST_ITEMS = 10000;

// ゴーストメディア（DB 上にのみ存在し、FS 上に存在しないファイル）をスキャンする
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const isFullScan = searchParams.get("full") === "true";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: GhostMediaScanEventData) => {
        // クライアントが切断していたら enqueue しない
        if (!req.signal.aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }
      };

      try {
        let ghostItems: GhostMediaItem[];

        if (isFullScan) {
          ghostItems = await runFullScan(send, req.signal);
        } else {
          ghostItems = await runQuickScan(send, req.signal);
        }

        // 中断されていなければ最終結果を送信
        if (!req.signal.aborted) {
          send({ type: "complete", items: ghostItems });
        }
      } catch (error) {
        logger.error("api:ghost-media-scan", error);
        send({ type: "error", message: "Failed to scan ghost media" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// フルスキャン (ファイル単位)
async function runFullScan(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal
): Promise<GhostMediaItem[]> {
  // DB 上の全ファイルを取得
  const allMedia = await prisma.media.findMany({
    select: {
      id: true,
      title: true,
      path: true,
    },
  });

  const ghostItems: GhostMediaItem[] = [];
  const total = allMedia.length;
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
      if (ghostItems.length > MAX_GHOST_ITEMS) throw new AbortError();
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
  // dirPath の一覧（UNIQUE）を取得
  const allFolders = await prisma.media.findMany({
    distinct: ["dirPath"],
    select: {
      dirPath: true,
    },
  });

  const ghostItems: GhostMediaItem[] = [];
  const total = allFolders.length;
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
        const items = await prisma.media.findMany({
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
      if (ghostItems.length > MAX_GHOST_ITEMS) throw new AbortError();
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
