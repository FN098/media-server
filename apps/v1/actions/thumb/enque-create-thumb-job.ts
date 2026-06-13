"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { acquireLock } from "@/lib/redis/lock";
import { thumbQueue } from "@/lib/thumb-job/queue";
import { sha1Hash } from "@/lib/utils/sha1-hash";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  filePath: EditableVirtualPathSchema,
  force: z.boolean().optional().default(false),
});

type ActionResult = { success: true } | { success: false; message: string };

// サムネ生成ジョブ登録（ファイル単位）
export async function enqueueCreateSingleThumbJobAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { filePath, force: forceCreate } = parsed.data;

  // 認証＋認可
  const auth = await authorize("thumbnail:create");
  if (!auth.success) {
    return auth;
  }

  try {
    const lockKey = `thumb-lock:file:${sha1Hash(filePath)}`;
    const isLocked = await acquireLock(lockKey);

    if (!isLocked) {
      return { success: false, message: "ジョブがすでに登録されています。" };
    }

    await thumbQueue.add(
      "create-thumb-single",
      {
        type: "file",
        path: filePath,
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
