import { ThumbJobData } from "@/workers/thumb/types";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL");
}

// 開発サーバー用シングルトン
const g = globalThis as typeof globalThis & {
  redis?: IORedis;
  thumbQueue?: Queue<ThumbJobData>;
};

export const connection =
  g.redis ??
  new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

export const thumbQueue =
  g.thumbQueue ??
  new Queue<ThumbJobData>("thumbs", {
    connection,
  });

if (process.env.NODE_ENV !== "production") {
  g.redis = connection;
  g.thumbQueue = thumbQueue;
}
