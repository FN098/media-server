"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { restoreDatabaseFromFile } from "@/lib/child_process/mysql";
import { dumpDatabaseToFile } from "@/lib/child_process/mysqldump";
import { DB_BACKUP_DIR, TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupFile } from "@/lib/db-backup/types";
import { parseDatabaseURL } from "@/lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
import { logger } from "@/lib/logger";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs/promises";
import path from "path";

async function listSqlFiles(dirPath: string) {
  const fileNames = await fs.readdir(dirPath);

  return await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".sql"))
      .map(async (fileName) => {
        const filePath = path.join(dirPath, fileName);
        const stats = await fs.stat(filePath);
        return {
          name: fileName,
          mtime: stats.mtime,
          size: stats.size,
        };
      })
  );
}

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

type DumpDatabaseResult =
  | { success: true }
  | { success: false; message: string };

// DBダンプ
export async function dumpDatabaseAction(): Promise<DumpDatabaseResult> {
  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 認可
  if (!hasPermission(user, "db-backup:dump")) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(DB_BACKUP_DIR, fileName);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  let result: Awaited<ReturnType<typeof dumpDatabaseToFile>>;
  try {
    logger.info("action:db-dump", "dump database started.");
    result = await dumpDatabaseToFile(db, filePath);
    logger.info("action:db-dump", "dump database ended.", result);
  } catch (error) {
    logger.error("action:db-dump", error);
    return { success: false, message: "DBダンプ中にエラーが発生しました" };
  }

  if (!result.ok) {
    return {
      success: false,
      message: "DBダンプが正常に終了しませんでした",
    };
  }

  return { success: true };
}

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
