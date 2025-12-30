import { connection } from "@/workers/thumb/queue";
import { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Redis の subscribe モードに入るとその接続は他のコマンドに使えなくなるため、
      // 既存の接続を複製して Subscribe 用に使う
      const subscriber = connection.duplicate();

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
}
