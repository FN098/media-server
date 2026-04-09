"use server";

import { getServerMediaDbPath } from "@/lib/path/helpers";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);
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
  debugger;
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // 環境変数からDB情報を取得する想定
    const cmd = `mysqldump -u ${process.env.MYSQL_USER} -p${process.env.MYSQL_PASSWORD} ${process.env.MYSQL_DATABASE} > ${filePath}`;
    await execPromise(cmd);
    return { success: true, fileName };
  } catch (error) {
    console.error("create db backup error", error);
    return { success: false, error: "バックアップに失敗しました" };
  }
}

// リストアの実行
export async function restoreBackupAction(fileName: string) {
  const filePath = path.join(BACKUP_DIR, fileName);
  try {
    const cmd = `mysql -u ${process.env.MYSQL_USER} -p${process.env.MYSQL_PASSWORD} ${process.env.MYSQL_DB} < ${filePath}`;
    await execPromise(cmd);
    return { success: true };
  } catch (error) {
    console.error("restore db backup error", error);
    return { success: false, error: "リストアに失敗しました" };
  }
}
