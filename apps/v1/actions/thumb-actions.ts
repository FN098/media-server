"use server";

import { hashPath } from "@/lib/utils/path";
import { connection, thumbQueue } from "@/workers/thumb/queue";

const LOCK_TTL = 1000 * 60 * 10; // 10分

async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
  // key: lockKey
  // value: 1 (any)
  // PX: milli-second EXpire (ttl)
  // LOCK_TTL: milli-seconds
  // NX: Not eXists (set only if not exists)
  const res = await connection.set(key, "1", "PX", ttlMs, "NX");
  return res === "OK";
}

export async function enqueueThumbJob(dirPath: string, forceCreate = false) {
  const lockKey = `thumb-lock:dir:${hashPath(dirPath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return;
  }

  await thumbQueue.add(
    "create-thumbs",
    {
      dirPath,
      createdAt: Date.now(),
      lockKey,
      forceCreate,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    },
  );
}

export async function enqueueSingleThumbJob(
  filePath: string,
  forceCreate = false,
) {
  const lockKey = `thumb-lock:dir:${hashPath(filePath)}`;
  const locked = await acquireLock(lockKey, LOCK_TTL);

  if (!locked) {
    // すでに処理中
    return;
  }

  await thumbQueue.add(
    "create-thumb-single",
    {
      filePath,
      createdAt: Date.now(),
      lockKey,
      forceCreate,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
      lifo: true,
    },
  );
}
