"use server";

import { authorize } from "@/lib/authorization/authorize";
import { togglePinVisitedFolder } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
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
  const auth = await authorize("toggle-pin-visited-folder");
  if (!auth.success) {
    return {
      success: false,
      message: auth.message,
    };
  }
  const { user } = auth;

  try {
    await togglePinVisitedFolder(user.id, folderId, currentPinned);
  } catch (error) {
    logger.error("toggle-pin-visited-folder-action", error);
    return {
      success: false,
      message: "フォルダ訪問履歴ピン留め更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
