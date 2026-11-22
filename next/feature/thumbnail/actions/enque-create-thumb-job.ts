"use server";

import { thumbQueue } from "@/feature/thumbnail/lib/queue";
import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { acquireLock } from "@/lib/redis/lock";
import { sha1Hash } from "@/lib/utils/sha1-hash";
import z from "zod";

const inputSchema = z.object({
  fileId: z.uuid(),
  force: z.boolean().optional().default(false),
});

type ActionResult = { success: true } | { success: false; message: string };

// サムネ生成ジョブ登録（ファイル単位）
export async function enqueueCreateSingleThumbJobAction({
  fileId,
  forceCreate,
}: {
  fileId: string;
  forceCreate?: boolean;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("create-thumbnail");
  if (!auth.success) {
    return auth;
  }

  try {
    const lockKey = `thumb-lock:file:${sha1Hash(fileId)}`;
    const isLocked = await acquireLock(lockKey);

    if (!isLocked) {
      return { success: false, message: "ジョブがすでに登録されています。" };
    }

    await thumbQueue.add(
      "create-thumb-single",
      {
        type: "file",
        id: fileId,
        createdAt: Date.now(),
        lockKey,
        forceCreate: forceCreate,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
        lifo: true,
      }
    );

    return { success: true };
  } catch (error) {
    logger.error("enque-create-single-thumb-job-action", error);
    return { success: false, message: "サムネ作成ジョブ登録に失敗しました。" };
  }
}
