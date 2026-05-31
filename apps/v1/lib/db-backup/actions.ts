"use server";

import { restoreDatabaseFromFile } from "@/lib/child_process/mysql";
import { dumpDatabaseToFile } from "@/lib/child_process/mysqldump";
import { DB_BACKUP_DIR, TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupFile } from "@/lib/db-backup/types";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
import { FileNameSchema } from "@/lib/path/schemas";
import { parseDatabaseURL } from "@/lib/utils/db-url-parser";
import fs from "fs/promises";
import path from "path";

async function readFileList(dirPath: string) {
  const fileNames = await fs.readdir(dirPath);

  return await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".sql"))
      .map(async (fileName) => {
        const filePath = path.join(dirPath, fileName);
        const stats = await fs.stat(filePath);
        return { name: fileName, mtime: stats.mtime, size: stats.size };
      })
  );
}

// バックアップ一覧
export async function listBackupFilesAction(): Promise<DbBackupFile[]> {
  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  try {
    const files = await readFileList(DB_BACKUP_DIR);

    // 新しい順にソート
    const sorted = files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return sorted.map((file) => ({
      name: file.name,
      label: file.name,
      size: file.size,
      createdAt: file.mtime.toISOString(),
      isTemp: false,
    }));
  } catch (error) {
    console.error("list backup files error", error);

    return [];
  }
}

// DBダンプ
export async function dumpDatabaseAction() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(DB_BACKUP_DIR, fileName);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  try {
    console.log("dump database started.");
    const result = await dumpDatabaseToFile(db, filePath);
    console.log("dump database ended:", result);

    if (result.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: "DBダンプが正常に終了しませんでした",
      };
    }
  } catch (error) {
    console.error("dump database error", error);

    return { success: false, error: "DBダンプ中にエラーが発生しました" };
  }
}

// DBリストア
export async function restoreDatabaseAction(file: DbBackupFile) {
  const parsedFileName = FileNameSchema.safeParse(file.name);
  if (!parsedFileName.success) {
    return { success: false, error: "不正なファイル名です" };
  }

  const filePath = file.isTemp
    ? path.join(TEMP_DB_BACKUP_DIR, parsedFileName.data)
    : path.join(DB_BACKUP_DIR, parsedFileName.data);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  try {
    console.log("restore database started.");
    const result = await restoreDatabaseFromFile(db, filePath);
    console.log("restore database ended:", result);

    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: "DBリストアが正常に終了しませんでした" };
    }
  } catch (error) {
    console.error("restore database error", error);

    const message =
      (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "バックアップファイルが見つかりませんでした"
        : "DBリストア中にエラーが発生しました";

    return { success: false, error: message };
  }
}

// バックアップファイルの削除
export async function deleteBackupAction(file: DbBackupFile) {
  const parsedFileName = FileNameSchema.safeParse(file.name);
  if (!parsedFileName.success) {
    return { success: false, error: "不正なファイル名です" };
  }

  const filePath = path.join(DB_BACKUP_DIR, parsedFileName.data);

  try {
    await fs.unlink(filePath);

    return { success: true };
  } catch (error) {
    console.error("delete db backup error", error);

    const message =
      (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "バックアップファイルが見つかりませんでした"
        : "バックアップファイルの削除に失敗しました";

    return { success: false, error: message };
  }
}

// バックアップの世代管理
export async function cleanupOldBackupsAction(keepCount: number = 10) {
  const files = await readFileList(DB_BACKUP_DIR);

  // 新しい順にソート
  const sorted = files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  // 規定数を超えたファイルを削除
  const filesToDelete = sorted.slice(keepCount);

  try {
    for (const file of filesToDelete) {
      await fs.unlink(path.join(DB_BACKUP_DIR, file.name));
      console.log(`Deleted old backup: ${file.name}`);
    }

    return { success: true, deletedCount: filesToDelete.length };
  } catch (error) {
    console.error("Cleanup backups error:", error);

    return {
      success: false,
      error: "古いバックアップファイルの削除に失敗しました",
    };
  }
}
