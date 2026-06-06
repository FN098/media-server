import { redis } from "@/lib/redis";

// ジョブの有効期限
export const DEFAULT_LOCK_TTL_MS = 1000 * 60 * 10; // 10分

/**
 * Redis を使ってロックを取得
 *
 * @returns
 *  true  ロック取得成功（他に処理している人はいない）
 *  false 既にロックあり（他のワーカーが処理中）
 */
export async function acquireLock(
  key: string,
  ttlMs = DEFAULT_LOCK_TTL_MS
): Promise<boolean> {
  // key: lockKey
  // value: 1 (any)
  // PX: milli-second EXpire (ttl)
  // LOCK_TTL: milli-seconds
  // NX: Not eXists (set only if not exists)
  const res = await redis.set(key, "1", "PX", ttlMs, "NX");
  return res === "OK";
}
