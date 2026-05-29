"use server";

import { DB_BACKUP_DIR, TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupFile } from "@/lib/db-backup/types";
import { getDatabaseUrl, parseDatabaseURL } from "@/lib/utils/url";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

// バックアップ一覧の取得
export async function getBackupListAction() {
  try {
    await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

    const files = await fs.readdir(DB_BACKUP_DIR);

    // 各ファイルの情報を取得
    const backupList = await Promise.all(
      files
        .filter((file) => file.endsWith(".sql"))
        .map(async (file) => {
          const stats = await fs.stat(path.join(DB_BACKUP_DIR, file));
          return {
            name: file,
            label: file,
            createdAt: stats.mtime.toISOString(),
            size: stats.size,
            isTemp: false,
          } satisfies DbBackupFile;
        })
    );

    // 新しい順にソート
    return backupList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("list db backup error", error);
    return [];
  }
}

// バックアップの実行
export async function createBackupAction() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(DB_BACKUP_DIR, fileName);
  const databaseUrl = getDatabaseUrl();
  const db = parseDatabaseURL(databaseUrl);

  let fileHandle: fs.FileHandle | null = null;

  try {
    await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

    fileHandle = await fs.open(filePath, "w");

    await new Promise<void>((resolve, reject) => {
      const child = spawn("mysqldump", [
        "-h",
        db.host,
        "-P",
        db.port,
        "-u",
        db.user,
        `-p${db.password}`,
        db.database,
      ]);

      const stream = fileHandle!.createWriteStream();
      child.stdout.pipe(stream);

      child.stderr.on("data", (data: Buffer) => {
        console.error("mysqldump error:", data.toString());
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`mysqldump exited with code ${code}`));
      });

      child.on("error", reject);
    });

    return { success: true, fileName };
  } catch (error) {
    console.error("create db backup error", error);

    // ゴミファイル削除
    try {
      await fs.unlink(filePath);
    } catch {}

    return { success: false, error: "バックアップに失敗しました" };
  } finally {
    // ファイルハンドルは必ず解放
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}

// リストアの実行
export async function restoreBackupAction(file: DbBackupFile) {
  // セキュリティ対策: ファイル名にパス区切り文字が含まれていないかチェック
  // (ディレクトリトラバーサル対策)
  if (file.name.includes("/") || file.name.includes("\\")) {
    return { success: false, error: "不正なファイル名です" };
  }

  const filePath = file.isTemp
    ? path.join(TEMP_DB_BACKUP_DIR, file.name)
    : path.join(DB_BACKUP_DIR, file.name);

  const databaseUrl = getDatabaseUrl();
  const db = parseDatabaseURL(databaseUrl);

  let fileHandle: fs.FileHandle | null = null;

  try {
    fileHandle = await fs.open(filePath, "r");

    await new Promise<void>((resolve, reject) => {
      const child = spawn("mysql", [
        "-h",
        db.host,
        "-P",
        db.port,
        "-u",
        db.user,
        `-p${db.password}`,
        db.database,
      ]);

      const stream = fileHandle!.createReadStream();
      stream.pipe(child.stdin);

      stream.on("end", () => {
        child.stdin.end();
      });

      child.stderr.on("data", (data: Buffer) => {
        console.error("mysql error:", data.toString());
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`mysql exited with code ${code}`));
      });

      child.on("error", reject);
    });

    return { success: true };
  } catch (error) {
    console.error("restore db backup error", error);

    // エラー内容に応じたメッセージ（ファイルが見つからない場合など）
    const message =
      (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "ファイルが見つかりませんでした"
        : "リストアに失敗しました";

    return { success: false, error: message };
  } finally {
    // ファイルハンドルは必ず解放
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}

// バックアップファイルの削除
export async function deleteBackupAction(file: DbBackupFile) {
  // セキュリティ対策: ファイル名にパス区切り文字が含まれていないかチェック
  // (ディレクトリトラバーサル対策)
  if (file.name.includes("/") || file.name.includes("\\")) {
    return { success: false, error: "不正なファイル名です" };
  }

  const filePath = path.join(DB_BACKUP_DIR, file.name);

  try {
    // 削除実行
    await fs.unlink(filePath);

    return { success: true };
  } catch (error) {
    console.error("delete db backup error", error);

    // エラー内容に応じたメッセージ（ファイルが見つからない場合など）
    const message =
      (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "ファイルが見つかりませんでした"
        : "削除に失敗しました";

    return { success: false, error: message };
  }
}

// バックアップの世代管理
export async function cleanupOldBackupsAction(keepCount: number = 10) {
  try {
    const files = await fs.readdir(DB_BACKUP_DIR);
    const backupFiles = await Promise.all(
      files
        .filter((file) => file.endsWith(".sql"))
        .map(async (file) => {
          const stats = await fs.stat(path.join(DB_BACKUP_DIR, file));
          return { name: file, mtime: stats.mtime };
        })
    );

    // 新しい順にソート
    backupFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // 規定数を超えたファイルを削除
    const filesToDelete = backupFiles.slice(keepCount);
    for (const file of filesToDelete) {
      await fs.unlink(path.join(DB_BACKUP_DIR, file.name));
      console.log(`Deleted old backup: ${file.name}`);
    }

    return { success: true, deletedCount: filesToDelete.length };
  } catch (error) {
    console.error("Cleanup backups error:", error);

    return {
      success: false,
      error: "古いバックアップの削除に失敗しました",
    };
  }
}
