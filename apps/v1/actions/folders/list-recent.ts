"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { getRecentFolders } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { basename } from "@/lib/virtual-path/path";

type ListRecentFolderResult =
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
export async function listRecentFoldersAction(): Promise<ListRecentFolderResult> {
  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "folder:list-history")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  let folders: Awaited<ReturnType<typeof getRecentFolders>>;
  try {
    folders = await getRecentFolders(user.id, 10);
  } catch (error) {
    logger.error("action:list-folder-history", error);
    return {
      success: false,
      message: "訪問済みフォルダ一覧の取得に失敗しました。",
    };
  }

  return {
    success: true,
    data: folders.map((f) => ({
      path: f.dirPath,
      name: basename(f.dirPath),
      pinned: f.isPinned,
    })),
  };
}
