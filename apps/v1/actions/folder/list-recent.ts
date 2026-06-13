"use server";

import { authorize } from "@/lib/authorization/authorize";
import { getRecentFolders } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { basename } from "@/lib/virtual-path/path";

type ActionResult =
  | {
      success: true;
      data: {
        path: string;
        name: string;
        pinned: boolean;
      }[];
    }
  | {
      success: false;
      message: string;
    };

// 最近訪問したフォルダを取得
export async function listRecentFoldersAction(): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("folder:list-visited");
  if (!auth.success) {
    return auth;
  }
  const { user } = auth;

  try {
    const folders = await getRecentFolders(user.id, 10);

    return {
      success: true,
      data: folders.map((f) => ({
        path: f.dirPath,
        name: basename(f.dirPath),
        pinned: f.isPinned,
      })),
    };
  } catch (error) {
    logger.error("action:list-recent-folders", error);
    return {
      success: false,
      message: "訪問済みフォルダ一覧の取得に失敗しました。",
    };
  }
}
