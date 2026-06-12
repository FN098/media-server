"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { renameNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { getPathInfo, isFsNotFoundError } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { dirname, join } from "@/lib/virtual-path/path";
import {
  FileOrFolderNameSchema,
  VirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import { rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type RenameNodeResult =
  | {
      success: true;
      from: string;
      to: string;
    }
  | {
      success: false;
      message: string;
      code?: "duplicated";
      errors?: { prop: string; issues?: unknown[] }[];
    };

// リネーム
export async function renameNodeAction(
  sourcePath: string,
  newName: string
): Promise<RenameNodeResult> {
  // 入力バリデーション＋正規化
  if (!sourcePath || newName.length === 0) {
    return {
      success: false,
      message: "処理対象のパスまたは名前が指定されていません。",
    };
  }

  const parsed = {
    sourcePath: VirtualPathSchema.safeParse(sanitize(sourcePath)),
    newName: FileOrFolderNameSchema.safeParse(sanitize(newName)),
  };
  if (!parsed.sourcePath.success || !parsed.newName.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePath", issues: parsed.sourcePath.error?.issues },
        { prop: "newName", issues: parsed.newName.error?.issues },
      ],
    };
  }

  const normalizedSourcePath = parsed.sourcePath.data;
  const normalizedNewName = parsed.newName.data;

  // ルートフォルダ保護
  if (isRootPath(normalizedSourcePath)) {
    return {
      success: false,
      message: "ルートフォルダは操作できません。",
    };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedSourcePath)) {
    return {
      success: false,
      message: "システムフォルダは操作できません。",
    };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const srcVirtualPath = normalizedSourcePath;
  const destVirtualPath = join(dirname(srcVirtualPath), normalizedNewName);

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

  // 認可
  if (
    (!isDirectory && !hasPermission(user, "file:rename")) ||
    (isDirectory && !hasPermission(user, "folder:rename"))
  ) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // 存在確認
  const destPathInfo = await getPathInfo(destRealPath);
  if (destPathInfo.exists) {
    return {
      success: false,
      message: `同名のファイルまたはフォルダが既に存在します。: ${destVirtualPath}`,
      code: "duplicated",
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
