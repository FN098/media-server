import { prisma } from "@/lib/db/prisma";
import {
  GhostMediaItem,
  GhostMediaScanEventData,
} from "@/lib/ghost-media/types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { access, constants } from "fs/promises";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// フルスキャン (ファイル単位)
async function runFullScan(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal
): Promise<GhostMediaItem[]> {
  const allMedia = await prisma.media.findMany({
    select: { id: true, title: true, path: true },
  });

  const ghostItems: GhostMediaItem[] = [];
  const total = allMedia.length;
  const batchSize = 30;

  for (let i = 0; i < total; i += batchSize) {
    if (signal.aborted) return ghostItems;

    const batch = allMedia.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        const realPath = getServerMediaPath(item.path);
        try {
          await access(realPath, constants.F_OK);
        } catch {
          ghostItems.push({ id: item.id, title: item.title, path: item.path });
        }
      })
    );

    send({
      type: "progress",
      current: Math.min(i + batchSize, total),
      total,
      found: ghostItems.length,
    });
  }
  return ghostItems;
}

// 高速スキャン (フォルダ単位)
async function runQuickScan(
  send: (data: GhostMediaScanEventData) => void,
  signal: AbortSignal
): Promise<GhostMediaItem[]> {
  const folders = await prisma.media.groupBy({ by: ["dirPath"] });
  const ghostItems: GhostMediaItem[] = [];
  const total = folders.length;

  for (let i = 0; i < total; i++) {
    if (signal.aborted) return ghostItems;

    const folder = folders[i];
    const realPath = getServerMediaPath(folder.dirPath);
    try {
      await access(realPath, constants.F_OK);
    } catch {
      const items = await prisma.media.findMany({
        where: { dirPath: folder.dirPath },
        select: { id: true, title: true, path: true },
      });
      ghostItems.push(...items);
    }

    send({
      type: "progress",
      current: i + 1,
      total,
      found: ghostItems.length,
    });
  }
  return ghostItems;
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
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
        let finalItems: GhostMediaItem[] = [];

        if (isFullScan) {
          finalItems = await runFullScan(send, req.signal);
        } else {
          finalItems = await runQuickScan(send, req.signal);
        }

        // 中断されていなければ最終結果を送信
        if (!req.signal.aborted) {
          send({ type: "complete", items: finalItems });
        }
      } catch (error) {
        console.error("Ghost Media Scan Error:", error);
        send({ type: "error", message: "スキャン中にエラーが発生しました" });
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
