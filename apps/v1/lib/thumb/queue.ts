import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// 開発サーバー用シングルトン
const globalForQueue = global as unknown as { thumbQueue: Queue | undefined };

export const thumbQueue =
  globalForQueue.thumbQueue ?? new Queue("thumbs", { connection });

if (process.env.NODE_ENV !== "production")
  globalForQueue.thumbQueue = thumbQueue;
