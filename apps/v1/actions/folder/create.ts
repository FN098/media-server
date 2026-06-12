"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isBlockedVirtualPath } from "@/lib/path/protections";
import { existsPath } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import {
  FolderNameSchema,
  VirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";

type CreateFolderResult =
  | { success: true }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// フォルダ作成
export async function createFolderAction(
  parentPath: string,
  folderName: string
): Promise<CreateFolderResult> {
  // 入力バリデーション＋正規化
  if (!parentPath || !folderName) {
    return {
      success: false,
      message: "処理対象のパスまたはフォルダ名が指定されていません。",
    };
  }

  const parsed = {
    parentPath: VirtualPathSchema.safeParse(sanitize(parentPath)),
    folderName: FolderNameSchema.safeParse(sanitize(folderName)),
  };

  if (!parsed.parentPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "parentPath", issues: parsed.parentPath.error?.issues }],
    };
  }

  if (!parsed.folderName.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "folderName", issues: parsed.folderName.error?.issues }],
    };
  }

  const normalizedParentPath = parsed.parentPath.data;
  const normalizedFolderName = parsed.folderName.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "folder:create")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // フォルダ保護
  if (isBlockedVirtualPath(normalizedParentPath)) {
    return {
      success: false,
      message: "このフォルダにはアクセスできません。",
    };
  }

  // 仮想パス→物理パス
  const newVirtualPath = join(normalizedParentPath, normalizedFolderName);
  const newRealPath = getServerMediaPath(newVirtualPath);

  if (await existsPath(newRealPath)) {
    return {
      success: false,
      message: "同名のフォルダまたはファイルが既に存在します。",
    };
  }

  try {
    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    logger.error("action:create-folder", error);
    return {
      success: false,
      message: "フォルダの作成に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/explorer");

  return { success: true };
}
