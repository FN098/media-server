import { redis } from "@/__lib/redis";
import { createThumbs } from "@/__lib/thumb/factory";
import {
  ThumbJobCompletedEvent,
  ThumbJobData,
} from "@/feature/thumbnail/lib/types";
import { getFsNode, listFsNodes } from "@/lib/fs/fs-listing";
import { sortNodes } from "@/lib/sort/sort-nodes";
import { chunk } from "@/lib/utils/array";
import { Job } from "bullmq";
import path from "node:path";

const EXPIRE_MS = 1000 * 60 * 10; // 10分

export async function processThumbJob(job: Job<ThumbJobData>) {
  const { createdAt } = job.data;

  // 発行から時間が経ちすぎたジョブは処理せず破棄
  if (Date.now() - createdAt > EXPIRE_MS) {
    console.log(`[Job ${job.id}] expired, removing`);
    await job.remove();
    return;
  }

  switch (job.name) {
    case "create-thumbs":
      return withLockRelease(job, () => handleCreateThumbs(job));

    case "create-thumb-single":
      return withLockRelease(job, () => handleCreateThumbSingle(job));

    default:
      console.warn(`Unknown job name: ${job.name}`);
  }
}

//
// handlers
//

// フォルダ単位でサムネイル作成
async function handleCreateThumbs(job: Job<ThumbJobData>) {
  const { type, id, forceCreate } = job.data;

  if (type !== "folder" || !id) {
    throw new Error("Invalid input");
  }

  console.log(`[Job ${job.id}] Batch Processing: ${id}`);

  const nodes = await listFsNodes(path);
  const sorted = sortNodes(nodes);

  let completed = 0;

  for (const batch of chunk(sorted, 10)) {
    await createThumbs(batch, {
      force: forceCreate,
    });

    await Promise.all(
      batch.map((node) =>
        publishThumbCompleted({
          type: "file",
          path: node.path,
        })
      )
    );

    completed += batch.length;

    console.log(`[Job ${job.id}] Progress: ${completed}/${nodes.length}`);
  }

  await publishThumbCompleted({ type: "directory", path });

  console.log(`[Job ${job.id}] Notified completion for: ${path}`);
}

// ファイル単位でサムネイル作成
async function handleCreateThumbSingle(job: Job<ThumbJobData>) {
  const { type, path, forceCreate } = job.data;

  if (type !== "file" || !path) {
    throw new Error("Invalid input");
  }

  console.log(`[Job ${job.id}] Single Processing: ${path}`);

  const node = await getFsNode(path);

  await createThumbs([node], {
    force: forceCreate,
  });

  await publishThumbCompleted({ type, path });

  console.log(`[Job ${job.id}] Notified completion for: ${path}`);
}

//
// common functions
//

async function publishThumbCompleted(event: ThumbJobCompletedEvent) {
  console.log("publish:", event);
  await redis.publish("thumb-completed", JSON.stringify(event));
}

async function withLockRelease(
  job: Job<ThumbJobData>,
  fn: () => Promise<void>
) {
  try {
    await fn();
  } finally {
    if (job.data.lockKey) {
      await redis.del(job.data.lockKey);
    }
  }
}
