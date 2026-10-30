"use server";

import { authorize } from "@/lib/authorization/authorize";
import {
  createFoldersOrSkip,
  deleteFoldersNotExists,
  getFolderPath,
} from "@/lib/folder/repository";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { isFsNotFoundError, isFsPermissionError } from "@/lib/utils/fs";
import { readdir } from "fs/promises";

type ActionResult =
  | {
      success: true;
      createdCount: number;
      deletedCount: number;
    }
  | {
      success: false;
      message: string;
    };

// サブフォルダ一覧更新
export async function refreshSubFoldersAction({
  parentFolderId,
}: {
  parentFolderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("refresh-sub-folders");
  if (!auth.success) {
    return auth;
  }

  let parentFolderPath: string;
  try {
    parentFolderPath = await getFolderPath(parentFolderId);
  } catch (error) {
    return {
      success: false,
      message: "フォルダが見つかりません。",
    };
  }

  // 仮想パス→物理パス
  const virtualFolderPath = parentFolderPath;
  const realFolderPath = resolveMediaPath(virtualFolderPath);

  try {
    const dirents = await readdir(realFolderPath, { withFileTypes: true });
    const folderNames = dirents.map((dir) => dir.name);

    // すでに存在するフォルダは作成しない
    const createdCount = await createFoldersOrSkip(parentFolderId, folderNames);

    // 存在しないフォルダ・ファイルを削除
    const deletedCount = await deleteFoldersNotExists(
      parentFolderId,
      folderNames
    );

    return {
      success: true,
      createdCount,
      deletedCount,
    };
  } catch (error) {
    if (isFsNotFoundError(error)) {
      return {
        success: false,
        message: "フォルダが見つかりません。",
      };
    }
    if (isFsPermissionError(error)) {
      return {
        success: false,
        message: "フォルダへのアクセス権がありません。",
      };
    }
    logger.error("refresh-sub-folders-action", error);
    return {
      success: false,
      message: "サブフォルダ一覧の取得に失敗しました。",
    };
  }
}
