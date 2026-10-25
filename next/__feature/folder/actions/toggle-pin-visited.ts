"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { togglePinVisitedFolder } from "@/__lib/folder/repository";
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

// フォルダ訪問履歴ピン留めトグル
export async function togglePinVisitedFolderAction({
  folderId,
  currentPinned,
}: {
  folderId: string;
  currentPinned: boolean;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("folder:pin-visited");
  if (!auth.success) {
    return auth;
  }
  const { user } = auth;

  try {
    await togglePinVisitedFolder(user.id, folderId, currentPinned);
  } catch (error) {
    logger.error("action:toggle-pin-visited-folder", error);
    return {
      success: false,
      message: "フォルダ訪問履歴ピン留め更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
