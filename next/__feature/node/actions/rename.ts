"use server";

import { APP_CONFIG } from "@/app.config";
import { authorize } from "@/lib/authorization/authorize";
import { getFilePath, renameFile } from "@/lib/file/repository";
import { getFolderPath, renameFolder } from "@/lib/folder/repository";
import { resolveRealPath } from "@/lib/fs/real-path";
import { logger } from "@/lib/logger";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { dirname, join } from "@/lib/virtual-path";
import { rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type ActionResult =
  | {
      success: true;
      from: string;
      to: string;
    }
  | {
      success: false;
      message: string;
      hasConflictName?: true;
    };

// リネーム
export async function renameNodeAction({
  id,
  isDirectory,
  newName,
}: {
  id: string;
  isDirectory: boolean;
  newName: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("file:rename", "folder:rename");
  if (!auth.success) {
    return auth;
  }

  const srcVirtualPath = isDirectory
    ? await getFolderPath(id)
    : await getFilePath(id);
  const destVirtualPath = join(dirname(srcVirtualPath), newName);

  // 仮想パス→物理パス
  const srcRealPath = resolveRealPath(srcVirtualPath);
  const destRealPath = resolveRealPath(destVirtualPath);

  // ディレクトリ判定
  const srcPathInfo = await getPathInfo(srcRealPath);
  if (!srcPathInfo.exists) {
    if (srcPathInfo.error === "not-found")
      return {
        success: false,
        message: `ファイルまたはフォルダが存在しません。: ${srcVirtualPath}`,
      };
    else
      return {
        success: false,
        message: `ファイルまたはフォルダへのアクセスが拒否されました。: ${srcVirtualPath}`,
      };
  }

  // 存在確認
  const destPathInfo = await getPathInfo(destRealPath);
  if (destPathInfo.exists) {
    return {
      success: false,
      message: `同名のファイルまたはフォルダが既に存在します。: ${destVirtualPath}`,
      hasConflictName: true,
    };
  }

  // not found の場合は処理継続、それ以外は失敗
  if (destPathInfo.error !== "not-found") {
    return {
      success: false,
      message: `ファイルまたはフォルダへのアクセスが拒否されました。: ${destVirtualPath}`,
    };
  }

  const srcThumbPath =
    resolveRealPath(srcVirtualPath) + APP_CONFIG.thumb.extension;
  const destThumbPath =
    resolveRealPath(destVirtualPath) + APP_CONFIG.thumb.extension;

  // サムネイルリネーム前処理
  try {
    await rm(destThumbPath, { recursive: true, force: true });
  } catch (e) {
    logger.error("rename-node-action:remove-thumbnails", e);
    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // サムネイルリネーム
  let thumbRenamed = false;
  try {
    await rename(srcThumbPath, destThumbPath);
    thumbRenamed = true;
  } catch (e) {
    // サムネイル元が not found （未作成）の場合は処理継続、それ以外は失敗
    if (!isFsNotFoundError(e)) {
      logger.error("rename-node-action:rename-thumbnail", e);
      return {
        success: false,
        message: "ファイルまたはフォルダのリネームに失敗しました。",
      };
    }
  }

  // FSリネーム
  try {
    await rename(srcRealPath, destRealPath);
  } catch (e) {
    logger.error("rename-node-action:rename-in-fs", e);

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("rename-node-action:rollback-rename-thumbnail", e);
      }
    }

    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // DB更新
  try {
    if (isDirectory) {
      await renameFolder({ id, newName });
    } else {
      await renameFile({ id, newName });
    }
  } catch (e) {
    logger.error("rename-node-action:rename-in-db", e);

    // FSロールバック
    try {
      await rename(destRealPath, srcRealPath);
    } catch (e) {
      logger.error("rename-node-action:rollback-rename-in-fs", e);
    }

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("rename-node-action:rollback-rename-thumbnail", e);
      }
    }

    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
    from: srcVirtualPath,
    to: destVirtualPath,
  };
}
