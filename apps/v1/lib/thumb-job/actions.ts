"use server";

import { redis } from "@/lib/redis";
import { thumbQueue } from "@/lib/thumb-job/queue";
import { sha1Hash } from "@/lib/utils/sha1-hash";

// ジョブの有効期限
const LOCK_TTL = 1000 * 60 * 10; // 10分

/**
 * Redis を使ってロックを取得
 *
 * @returns
 *  true  ロック取得成功（他に処理している人はいない）
 *  false 既にロックあり（他のワーカーが処理中）
 */
async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
  // key: lockKey
  // value: 1 (any)
  // PX: milli-second EXpire (ttl)
  // LOCK_TTL: milli-seconds
  // NX: Not eXists (set only if not exists)
  const res = await redis.set(key, "1", "PX", ttlMs, "NX");
  return res === "OK";
}

// サムネ生成ジョブ登録（ディレクトリ単位）
export async function enqueueCreateThumbsJobAction(
  dirPath: string,
  options?: {
    force?: boolean;
  }
) {
  const lockKey = `thumb-lock:dir:${sha1Hash(dirPath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return {
      success: false,
      error: "locked",
    };
  }

  await thumbQueue.add(
    "create-thumbs",
    {
      dirPath,
      createdAt: Date.now(),
      lockKey,
      forceCreate: options?.force ?? false,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    }
  );

  return {
    success: true,
  };
}

// サムネ生成ジョブ登録（ファイル単位）
export async function enqueueCreateSingleThumbJobAction(
  filePath: string,
  options?: {
    force?: boolean;
  }
) {
  const lockKey = `thumb-lock:dir:${sha1Hash(filePath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return {
      success: false,
      error: "locked",
    };
  }

  await thumbQueue.add(
    "create-thumb-single",
    {
      filePath,
      createdAt: Date.now(),
      lockKey,
      forceCreate: options?.force ?? false,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    }
  );

  return {
    success: true,
  };
}
