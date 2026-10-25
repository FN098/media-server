"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { updateFileTimestamp } from "@/lib/file/repository";
import { updateFolderTimestamp } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";

type ActionResult = { success: true } | { success: false; message: string };

// タイムスタンプ更新
export async function touchTimestampAction({
  id,
  isDirectory,
}: {
  id: string;
  isDirectory: boolean;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("file:touch-timestamp");
  if (!auth.success) {
    return auth;
  }

  // FS 更新不要：タイムスタンプは utime や open->close では更新されないため

  // DB 更新
  try {
    if (isDirectory) {
      await updateFolderTimestamp({ id });
    } else {
      await updateFileTimestamp({ id });
    }
  } catch (e) {
    logger.error("action:touch-timestamp", e);
    return {
      success: false,
      message: "タイムスタンプの更新に失敗しました。",
    };
  }

  return { success: true };
}
