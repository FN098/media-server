"use server";

import { getParentDirPath } from "@/lib/path-helpers";
import { thumbQueue } from "@/lib/thumb/queue";

export async function enqueueThumbJob(dirPath: string) {
  await thumbQueue.add(
    "create-thumbs",
    { dirPath },
    {
      jobId: `thumb-dir-${dirPath}`,
      removeOnComplete: true, // 完了したら ID を解放して次を許可
      removeOnFail: false, // 失敗した場合は ID を残して連続再試行を抑制
    }
  );
}

export async function enqueueSingleThumbJob(filePath: string) {
  await thumbQueue.add(
    "create-thumb-single",
    { filePath },
    {
      jobId: `thumb-file-${filePath}`,
      removeOnComplete: true, // 完了したら ID を解放して次を許可
      removeOnFail: false, // 失敗した場合は ID を残して連続再試行を抑制
    }
  );
}

export async function enqueueThumbJobByFilePath(filePath: string) {
  const parentDir = getParentDirPath(filePath);
  return await enqueueThumbJob(parentDir);
}
