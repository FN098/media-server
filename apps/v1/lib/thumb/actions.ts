"use server";

import { thumbQueue } from "@/lib/thumb/queue";

export async function enqueueThumbJob(dirPath: string) {
  await thumbQueue.add(
    "create-thumbs",
    { dirPath },
    { jobId: `thumb-${dirPath}` }
  );
}
