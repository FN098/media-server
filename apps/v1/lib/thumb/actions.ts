"use server";

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
