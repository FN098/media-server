"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { acquireLock } from "@/lib/redis/lock";
import { thumbQueue } from "@/lib/thumb-job/queue";
import { sha1Hash } from "@/lib/utils/sha1-hash";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const InputSchema = z.object({
  dirPath: VirtualPathSchema,
  force: z.boolean().optional().default(false),
});

type ActionResult = { success: true } | { success: false; message: string };

// サムネ生成ジョブ登録（ディレクトリ単位）
export async function enqueueCreateThumbsJobAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { dirPath, force: forceCreate } = parsed.data;

  // ルートフォルダ保護
  if (isRootPath(dirPath)) {
    return { success: false, message: "ルートフォルダは操作できません。" };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(dirPath)) {
    return { success: false, message: "システムフォルダは操作できません。" };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "thumbnail:create")) {
    return { success: false, message: "権限がありません。" };
  }

  try {
    const lockKey = `thumb-lock:dir:${sha1Hash(dirPath)}`;
    const locked = await acquireLock(lockKey);

    if (!locked) {
      return { success: false, message: "ジョブがすでに登録されています。" };
    }

    await thumbQueue.add(
      "create-thumbs",
      {
        type: "directory",
        path: dirPath,
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
    logger.error("action:enque-create-thumbs-job", error);
    return { success: false, message: "サムネ作成ジョブ登録に失敗しました。" };
  }
}
