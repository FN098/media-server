import { ThumbJobData } from "@/workers/thumb/types";
import { Queue } from "bullmq";
import IORedis from "ioredis";

// 開発サーバー用シングルトン
const g = globalThis as typeof globalThis & {
  connection?: IORedis;
  thumbQueue?: Queue<ThumbJobData>;
};

export const connection =
  g.connection ??
  new IORedis(process.env.REDIS_URL ?? "", {
    maxRetriesPerRequest: null,
  });

export const thumbQueue =
  g.thumbQueue ??
  new Queue<ThumbJobData>("thumbs", {
    connection,
  });

if (process.env.NODE_ENV !== "production") {
  g.connection = connection;
  g.thumbQueue = thumbQueue;
}
