"use server";

import { getParentDirPath } from "@/lib/path-helpers";
import { thumbQueue } from "@/lib/thumb/queue";
import { hashPath } from "@/lib/utils/path";

export async function enqueueThumbJob(dirPath: string) {
  await thumbQueue.add(
    "create-thumbs",
    { dirPath },
    {
      jobId: `thumb-dir-${hashPath(dirPath)}`,
      removeOnComplete: {
        age: 60, // 完了後 1 分で削除
      },
      removeOnFail: false, // 失敗した場合は ID を残して連続再試行を抑制
    }
  );
}

export async function enqueueSingleThumbJob(filePath: string) {
  await thumbQueue.add(
    "create-thumb-single",
    { filePath },
    {
      jobId: `thumb-file-${hashPath(filePath)}`,
      removeOnComplete: {
        age: 10, // 完了後 10 秒で削除
      },
      removeOnFail: false, // 失敗した場合は ID を残して連続再試行を抑制
    }
  );
}

export async function enqueueThumbJobByFilePath(filePath: string) {
  const parentDir = getParentDirPath(filePath);
  return await enqueueThumbJob(parentDir);
}
