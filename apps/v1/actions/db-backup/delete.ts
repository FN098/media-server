"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupFile } from "@/lib/db-backup/types";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs/promises";
import path from "path";

type DeleteBackupResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// バックアップファイルの削除
export async function deleteBackupAction(
  file: DbBackupFile
): Promise<DeleteBackupResult> {
  // 入力バリデーション
  const parsed = {
    fileName: FileNameSchema.safeParse(file.name),
  };
  if (!parsed.fileName.success) {
    return { success: false, message: "不正なファイル名です" };
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
  if (!hasPermission(user, "db-backup:delete")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  const filePath = path.join(DB_BACKUP_DIR, parsed.fileName.data);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("delete db backup error", error);

    const message = isFsNotFoundError(error)
      ? "バックアップファイルが見つかりませんでした"
      : "バックアップファイルの削除に失敗しました";

    return { success: false, message };
  }

  return { success: true };
}
