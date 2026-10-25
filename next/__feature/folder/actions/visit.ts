"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { updateVisitedFolder } from "@/__lib/folder/repository";
import { logger } from "@/__lib/logger";
import { revalidatePath } from "next/cache";

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// フォルダ訪問履歴更新
export async function visitFolderAction({
  folderId,
}: {
  folderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("folder:update-visited");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    await updateVisitedFolder(folderId, user.id);
  } catch (error) {
    logger.error("action:update-folder-history", error);
    return {
      success: false,
      message: "訪問済みフォルダの更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
