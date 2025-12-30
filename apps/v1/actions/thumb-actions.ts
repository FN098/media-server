"use server";

import { getParentDirPath } from "@/lib/path/helpers";
import { hashPath } from "@/lib/utils/path";
import { thumbQueue } from "@/workers/thumb/queue";

export async function enqueueThumbJob(dirPath: string) {
  await thumbQueue.add(
    "create-thumbs",
    {
      dirPath,
      createdAt: Date.now(),
    },
    {
      jobId: `thumb-dir-${hashPath(dirPath)}`,
      removeOnComplete: {
        age: 60,
      },
      removeOnFail: true,
      lifo: true,
    }
  );
}

export async function enqueueSingleThumbJob(filePath: string) {
  await thumbQueue.add(
    "create-thumb-single",
    {
      filePath,
      createdAt: Date.now(),
    },
    {
      jobId: `thumb-file-${hashPath(filePath)}`,
      removeOnComplete: {
        age: 10,
      },
      removeOnFail: true,
      lifo: true,
    }
  );
}

export async function enqueueThumbJobByFilePath(filePath: string) {
  const parentDir = getParentDirPath(filePath);
  return await enqueueThumbJob(parentDir);
}
