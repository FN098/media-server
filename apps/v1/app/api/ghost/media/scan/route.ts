import { scanGhostMedia } from "@/lib/ghost-media/scan";
import { GhostMediaScanEventData } from "@/lib/ghost-media/types";
import { logger } from "@/lib/logger";
import { badRequestResponse } from "@/lib/response/errors";
import { NextRequest } from "next/server";
import z from "zod";

const InputSchema = z.object({
  full: z.boolean(),
});

// ゴーストメディア（DB 上にのみ存在し、FS 上に存在しないファイル）をスキャンする
export function GET(req: NextRequest) {
  // 入力バリデーション
  const { searchParams } = req.nextUrl;
  const parsed = InputSchema.safeParse({
    full: searchParams.get("full") === "true",
  });

  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: parsed.error.message,
    });
  }

  const { full: isFullScan } = parsed.data;

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
        const ghostItems = await scanGhostMedia(send, req.signal, isFullScan);

        // 中断されていなければ最終結果を送信
        if (!req.signal.aborted) {
          send({ type: "complete", items: ghostItems });
        }

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        logger.error("api:ghost-media-scan", error);
        send({ type: "error", message: "Failed to scan ghost media" });
      } finally {
        controller.close();
      }
    },
  });
}
