"use server";

import { RecentFolder } from "@/feature/recent-folders/lib/types";
import { authorize } from "@/lib/authorization/authorize";
import { getRecentVisitedFolders } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";

type ActionResult =
  | {
      success: true;
      folders: RecentFolder[];
    }
  | {
      success: false;
      message: string;
    };

// 最近訪問したフォルダを取得
export async function listRecentFoldersAction(): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("list-recent-folders");
  if (!auth.success) {
    return auth;
  }
  const { user } = auth;

  try {
    const folders = await getRecentVisitedFolders(user.id, 10);

    return {
      success: true,
      folders,
    };
  } catch (error) {
    logger.error("list-recent-folders-action", error);
    return {
      success: false,
      message: "訪問済みフォルダ一覧の取得に失敗しました。",
    };
  }
}
