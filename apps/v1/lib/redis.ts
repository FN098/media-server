import IORedis from "ioredis";

// 開発サーバー用シングルトン
const g = globalThis as typeof globalThis & {
  redis?: IORedis;
};

export const redis =
  g.redis ??
  new IORedis(process.env.REDIS_URL ?? "", {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") {
  g.redis = redis;
}
