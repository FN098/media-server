"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { acquireLock } from "@/__lib/redis/lock";
import { sha1Hash } from "@/__lib/utils/sha1-hash";
import { EditableVirtualPathSchema } from "@/__lib/virtual-path/schemas";
import { thumbQueue } from "@/feature/thumbnail/lib/queue";
import { logger } from "@/lib/logger";
import z from "zod";

const InputSchema = z.object({
  filePath: EditableVirtualPathSchema,
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
  const auth = await authorize("thumbnail:create");
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
    logger.error("action:enque-create-single-thumb-job", error);
    return { success: false, message: "サムネ作成ジョブ登録に失敗しました。" };
  }
}
