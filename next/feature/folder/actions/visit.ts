"use server";

import { authorize } from "@/lib/authorization/authorize";
import { updateVisitedFolder } from "@/lib/folder/repository";
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

// フォルダ訪問履歴更新
export async function visitFolderAction({
  folderId,
}: {
  folderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("visit-folder");
  if (!auth.success) {
    return {
      success: false,
      message: auth.message,
    };
  }

  const { user } = auth;

  try {
    await updateVisitedFolder(folderId, user.id);
  } catch (error) {
    logger.error("visit-folder-action", error);
    return {
      success: false,
      message: "訪問済みフォルダの更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
