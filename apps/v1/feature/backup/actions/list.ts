"use server";

import { authorize } from "@/lib/authorization/authorize";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { listSqlFiles } from "@/lib/db-backup/fs";
import { DbBackupFile } from "@/lib/db-backup/types";
import { logger } from "@/lib/logger";
import fs from "fs/promises";

type ActionResult =
  | {
      success: true;
      files: DbBackupFile[];
    }
  | {
      success: false;
      message: string;
    };

// バックアップ一覧
export async function listDbBackupsAction(): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("db-backup:list");
  if (!auth.success) {
    return auth;
  }

  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  try {
    const files = await listSqlFiles(DB_BACKUP_DIR);

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
  } catch (error) {
    logger.error("action:list-db-backups", error);
    return {
      success: false,
      message: "バックアップ一覧の取得に失敗しました。",
    };
  }
}
