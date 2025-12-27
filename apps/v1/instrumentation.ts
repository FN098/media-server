import { PASS, USER } from "@/basic-auth";
import { prisma } from "@/lib/prisma";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Next.js Server Runtime Started");
    console.log("BASIC 認証情報", { USER, PASS });

    // 重複登録防止（型安全なチェック）
    if (!globalThis.isPrismaShutdownRegistered) {
      const handleDisconnect = async (signal: string) => {
        console.log(`Received ${signal}. Shutting down Prisma...`);
        try {
          // 5秒以内に切断できない場合はタイムアウト
          await Promise.race([
            prisma.$disconnect(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Prisma disconnect timeout")),
                5000
              )
            ),
          ]);
          console.log("Prisma disconnected successfully.");
        } catch (err) {
          console.error("Failed to disconnect Prisma:", err);
        } finally {
          process.exit(0);
        }
      };

      // 終了シグナルのリスナー登録
      process.once("SIGTERM", () => void handleDisconnect("SIGTERM"));
      process.once("SIGINT", () => void handleDisconnect("SIGINT"));

      globalThis.isPrismaShutdownRegistered = true;
    }
  }
}
