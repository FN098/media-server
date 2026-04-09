"use server";

import { getServerMediaDbPath } from "@/lib/path/helpers";
import { getDatabaseUrlInfo } from "@/lib/url/db";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const BACKUP_DIR = getServerMediaDbPath("");

// バックアップ一覧の取得
export async function getBackupListAction() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const files = await fs.readdir(BACKUP_DIR);
    return files
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .reverse(); // 新しい順
  } catch (error) {
    console.error("list db backup error", error);
    return [];
  }
}

// バックアップの実行
export async function createBackupAction() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);
  const db = getDatabaseUrlInfo();

  let fileHandle: fs.FileHandle | null = null;

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

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

      child.stdout.pipe(fileHandle!.createWriteStream());
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
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}

// リストアの実行
export async function restoreBackupAction(fileName: string) {
  const filePath = path.join(BACKUP_DIR, fileName);
  const db = getDatabaseUrlInfo();

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

      fileHandle!.createReadStream().pipe(child.stdin);
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
    return { success: false, error: "リストアに失敗しました" };
  } finally {
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}
