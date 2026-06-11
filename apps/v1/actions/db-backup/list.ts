"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { listSqlFiles } from "@/lib/db-backup/fs";
import { DbBackupFile } from "@/lib/db-backup/types";
import { logger } from "@/lib/logger";
import fs from "fs/promises";

type ListBackupFilesResult =
  | {
      success: true;
      files: DbBackupFile[];
    }
  | {
      success: false;
      message: string;
    };

// バックアップ一覧
export async function listBackupFilesAction(): Promise<ListBackupFilesResult> {
  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "db-backup:list")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  let files: Awaited<ReturnType<typeof listSqlFiles>>;
  try {
    files = await listSqlFiles(DB_BACKUP_DIR);
  } catch (error) {
    logger.error("action:list-db-backup-files", error);
    return {
      success: false,
      message: "バックアップ一覧の取得に失敗しました。",
    };
  }

  // 新しい順にソート
  const sorted = files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return {
    success: true,
    files: sorted.map((file) => ({
      name: file.name,
      label: file.name,
      size: file.size,
      createdAt: file.mtime.toISOString(),
      isTemp: false,
    })),
  };
}
