"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { updateVisitedFolder } from "@/lib/folder/repository";
import { logger } from "@/lib/logger";
import { isBlockedVirtualPath } from "@/lib/path/protections";
import { sanitize } from "@/lib/virtual-path/guard";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { revalidatePath } from "next/cache";

type VisitFolderResult =
  | { success: true }
  | {
      success: false;
      message: string;
    };

// フォルダ訪問履歴更新
export async function visitFolderAction(
  dirPath: string
): Promise<VisitFolderResult> {
  // 入力バリデーション＋正規化
  if (!dirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const normalizedDirPath = VirtualPathSchema.safeParse(sanitize(dirPath)).data;
  if (!normalizedDirPath) {
    return {
      success: false,
      message: `無効なパスです。: ${dirPath}`,
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

  // 認可
  if (!hasPermission(user, "folder:update-history")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // フォルダ保護
  if (isBlockedVirtualPath(normalizedDirPath)) {
    return {
      success: false,
      message: "このフォルダにはアクセスできません。",
    };
  }

  try {
    await updateVisitedFolder(normalizedDirPath, user.id);
  } catch (e) {
    logger.error("action:update-folder-history", e);
    return {
      success: false,
      message: "訪問済みフォルダの更新に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/dashboard");

  return { success: true };
}
