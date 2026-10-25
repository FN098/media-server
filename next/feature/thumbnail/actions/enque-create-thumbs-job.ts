"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { logger } from "@/__lib/logger";
import { acquireLock } from "@/__lib/redis/lock";
import { sha1Hash } from "@/__lib/utils/sha1-hash";
import { thumbQueue } from "@/feature/thumbnail/lib/queue";

type ActionResult = { success: true } | { success: false; message: string };

// サムネ生成ジョブ登録（ディレクトリ単位）
export async function enqueueCreateThumbsJobAction({
  folderId,
  forceCreate,
}: {
  folderId: string;
  forceCreate?: boolean;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("thumbnail:create");
  if (!auth.success) {
    return auth;
  }

  try {
    const lockKey = `thumb-lock:folder:${sha1Hash(folderId)}`;
    const locked = await acquireLock(lockKey);

    if (!locked) {
      return { success: false, message: "ジョブがすでに登録されています。" };
    }

    await thumbQueue.add(
      "create-thumbs",
      {
        type: "folder",
        id: folderId,
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
