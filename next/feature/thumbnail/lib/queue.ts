import { redis } from "@/__lib/redis";
import { ThumbJobData } from "@/feature/thumbnail/lib/types";
import { Queue } from "bullmq";

// 開発サーバー用シングルトン
const g = globalThis as typeof globalThis & {
  thumbQueue?: Queue<ThumbJobData>;
};

export const thumbQueue =
  g.thumbQueue ??
  new Queue<ThumbJobData>("thumbs", {
    connection: redis,
  });

if (process.env.NODE_ENV !== "production") {
  g.thumbQueue = thumbQueue;
}
