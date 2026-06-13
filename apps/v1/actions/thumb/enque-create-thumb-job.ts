"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { acquireLock } from "@/lib/redis/lock";
import { thumbQueue } from "@/lib/thumb-job/queue";
import { sha1Hash } from "@/lib/utils/sha1-hash";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { logger } from "better-auth";
import z from "zod";

const OptionsSchema = z
  .object({
    force: z.boolean().optional(),
  })
  .optional()
  .transform((v) => ({
    force: v?.force ?? false,
  }));

const InputSchema = z.object({
  filePath: VirtualPathSchema,
  options: OptionsSchema,
});

type ActionResult = { success: true } | { success: false; message: string };

// サムネ生成ジョブ登録（ファイル単位）
export async function enqueueCreateSingleThumbJobAction(
  filePath: string,
  options?: {
    force?: boolean;
  }
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse({ filePath, options });
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const normalizedPath = parsed.data.filePath;
  const forceCreate = parsed.data.options.force;

  // ルートフォルダ保護
  if (isRootPath(normalizedPath)) {
    return { success: false, message: "ルートフォルダは操作できません。" };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedPath)) {
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
    const lockKey = `thumb-lock:file:${sha1Hash(normalizedPath)}`;
    const isLocked = await acquireLock(lockKey);

    if (!isLocked) {
      return { success: false, message: "ジョブがすでに登録されています。" };
    }

    await thumbQueue.add(
      "create-thumb-single",
      {
        type: "file",
        path: normalizedPath,
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
