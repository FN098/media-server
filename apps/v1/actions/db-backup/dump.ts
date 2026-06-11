"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { dumpDatabaseToFile } from "@/lib/child_process/mysqldump";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { parseDatabaseURL } from "@/lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";

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
