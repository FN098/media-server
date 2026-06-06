"use server";

import { acquireLock } from "@/lib/redis/lock";
import { thumbQueue } from "@/lib/thumb-job/queue";
import { sha1Hash } from "@/lib/utils/sha1-hash";

// サムネ生成ジョブ登録（ディレクトリ単位）
export async function enqueueCreateThumbsJobAction(
  dirPath: string,
  options?: {
    force?: boolean;
  }
) {
  const lockKey = `thumb-lock:dir:${sha1Hash(dirPath)}`;
  const locked = await acquireLock(lockKey);

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
  const locked = await acquireLock(lockKey);

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
