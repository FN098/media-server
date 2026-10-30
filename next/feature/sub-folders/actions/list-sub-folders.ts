"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { db } from "@/lib/prisma";

type ActionResult =
  | {
      success: true;
      folders: { id: string; name: string }[];
    }
  | {
      success: false;
      message: string;
    };

// サブフォルダ一覧取得
export async function listSubFoldersAction({
  parentFolderId,
}: {
  parentFolderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("list-sub-folders");
  if (!auth.success) {
    return auth;
  }

  try {
    const folders = await db.folder.findMany({
      where: { parentFolderId },
      select: { id: true, name: true },
    });

    return {
      success: true,
      folders,
    };
  } catch (error) {
    logger.error("list-sub-folders-action", error);
    return {
      success: false,
      message: "サブフォルダ一覧の取得に失敗しました。",
    };
  }
}
