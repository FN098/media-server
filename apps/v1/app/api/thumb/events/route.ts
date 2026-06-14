import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import {
  forbiddenResponse,
  internalServerErrorResponse,
} from "@/lib/response/errors";

// サムネイルイベント購読
export async function GET(req: Request) {
  // 認証＋認可
  const auth = await authorize("thumbnail:subscribe-events");
  if (!auth.success) {
    return forbiddenResponse();
  }

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Redis の subscribe モードに入るとその接続は他のコマンドに使えなくなるため、
        // 既存の接続を複製して Subscribe 用に使う
        const subscriber = redis.duplicate();

        // Redis のメッセージを受け取って SSE 形式で送信
        await subscriber.subscribe("thumb-completed", (err) => {
          if (err) console.error("Redis subscribe error:", err);
        });

        subscriber.on("message", (channel, message) => {
          if (channel === "thumb-completed") {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          }
        });

        // クライアントが切断した時の処理
        req.signal.addEventListener("abort", () => {
          subscriber.disconnect();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("api:subscribe-thumb-events", error);
    return internalServerErrorResponse();
  }
}
