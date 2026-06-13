"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { renameNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { dirname, join } from "@/lib/virtual-path/path";
import {
  EditableVirtualPathSchema,
  FileOrFolderNameSchema,
} from "@/lib/virtual-path/schemas";
import { rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  sourcePath: EditableVirtualPathSchema,
  newName: FileOrFolderNameSchema,
});

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
export async function renameNodeAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePath, newName } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:rename", "folder:rename");
  if (!auth.success) {
    return auth;
  }

  const srcVirtualPath = sourcePath;
  const destVirtualPath = join(dirname(srcVirtualPath), newName);

  // 仮想パス→物理パス
  const srcRealPath = getServerMediaPath(srcVirtualPath);
  const destRealPath = getServerMediaPath(destVirtualPath);

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
  const isDirectory = srcPathInfo.isDirectory;

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

  const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
  const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

  // サムネイルリネーム前処理
  try {
    await rm(destThumbPath, { recursive: true, force: true });
  } catch (e) {
    logger.error("action:rename:thumb-preprocess", e);
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
      logger.error("action:rename:thumb", e);
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
    logger.error("action:rename:fs", e);

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("action:rename:fs:thumb-rollback", e);
      }
    }

    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // DB更新
  try {
    await renameNodeInDb({ srcVirtualPath, destVirtualPath, isDirectory });
  } catch (e) {
    logger.error("action:rename:db-node", e);

    // FSロールバック
    try {
      await rename(destRealPath, srcRealPath);
    } catch (e) {
      logger.error("action:rename:db:fs-rollback", e);
    }

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("action:rename:db:thumb-rollback", e);
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
