"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { restoreDatabaseFromFile } from "@/lib/child_process/mysql";
import { DB_BACKUP_DIR, TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupFile } from "@/lib/db-backup/types";
import { parseDatabaseURL } from "@/lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
import { logger } from "@/lib/logger";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import path from "path";

type RestoreDatabaseResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// DBリストア
export async function restoreDatabaseAction(
  file: DbBackupFile
): Promise<RestoreDatabaseResult> {
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
  if (!hasPermission(user, "db-backup:restore")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  const filePath = file.isTemp
    ? path.join(TEMP_DB_BACKUP_DIR, parsed.fileName.data)
    : path.join(DB_BACKUP_DIR, parsed.fileName.data);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  let result: Awaited<ReturnType<typeof restoreDatabaseFromFile>>;
  try {
    logger.info("action:db-restore", "restore database started.");
    result = await restoreDatabaseFromFile(db, filePath);
    logger.info("action:db-restore", "restore database ended:", result);
  } catch (error) {
    logger.error("action:db-restore", error);

    const message = isFsNotFoundError(error)
      ? "バックアップファイルが見つかりませんでした"
      : "DBリストア中にエラーが発生しました";

    return { success: false, message };
  }

  if (!result.ok) {
    return { success: false, message: "DBリストアが正常に終了しませんでした" };
  }

  return { success: true };
}
