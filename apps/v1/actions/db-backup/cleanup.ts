"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { listSqlFiles } from "@/lib/db-backup/fs";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";

const MIN_KEEP_COUNT = 3;
const MAX_KEEP_COUNT = 100;

type CleanupOldBackupsResult =
  | {
      success: true;
      deletedCount: number;
    }
  | {
      success: false;
      message: string;
    };

// バックアップの世代管理
export async function cleanupOldBackupsAction(
  keepCount: number = 10
): Promise<CleanupOldBackupsResult> {
  // 入力バリデーション
  if (keepCount < MIN_KEEP_COUNT || keepCount > MAX_KEEP_COUNT) {
    return {
      success: false,
      message: `keepCount は ${MIN_KEEP_COUNT} 以上 ${MAX_KEEP_COUNT} 以下で入力してください。`,
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
  if (!hasPermission(user, "db-backup:clean")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  const files = await listSqlFiles(DB_BACKUP_DIR);

  // 新しい順にソート
  const sorted = files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  // 規定数を超えたファイルを削除
  const filesToDelete = sorted.slice(keepCount);

  try {
    for (const file of filesToDelete) {
      await fs.unlink(path.join(DB_BACKUP_DIR, file.name));
      logger.info("action:db-backup-clean", `Deleted old backup: ${file.name}`);
    }
  } catch (error) {
    logger.error("action:db-backup-clean", error);
    return {
      success: false,
      message: "古いバックアップファイルのクリーンアップに失敗しました",
    };
  }

  return { success: true, deletedCount: filesToDelete.length };
}
