"use server";

import { getParentDirPath } from "@/lib/path-helpers";
import { thumbQueue } from "@/lib/thumb/queue";

export async function enqueueThumbJob(dirPath: string) {
  await thumbQueue.add(
    "create-thumbs",
    { dirPath },
    {
      jobId: `thumb-dir-${dirPath}`,
      removeOnComplete: true,
      removeOnFail: { count: 1000 },
    }
  );
}

export async function enqueueSingleThumbJob(filePath: string) {
  await thumbQueue.add(
    "create-thumb-single",
    { filePath },
    {
      jobId: `thumb-file-${filePath}`,
      removeOnComplete: true,
      removeOnFail: { count: 100 },
    }
  );
}

export async function enqueueThumbJobByFilePath(filePath: string) {
  const parentDir = getParentDirPath(filePath);
  return await enqueueThumbJob(parentDir);
}
