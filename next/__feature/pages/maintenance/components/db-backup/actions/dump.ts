"use server";

import { DB_BACKUP_DIR } from "@/__lib/db-backup/config";
import { buildDbBackupFileName } from "@/__lib/db-backup/filename";
import { parseDatabaseURL } from "@/__lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/__lib/env/env-server";
import { authorize } from "@/lib/authorization/authorize";
import { dumpDatabaseToFile } from "@/lib/child_process/mysqldump";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";

type ActionResult = { success: true } | { success: false; message: string };

// DBダンプ
export async function dumpDatabaseAction(): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("db-backup:dump");
  if (!auth.success) {
    return auth;
  }

  const fileName = buildDbBackupFileName();
  const filePath = path.join(DB_BACKUP_DIR, fileName);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  await fs.mkdir(DB_BACKUP_DIR, { recursive: true });

  try {
    logger.info("action:dump-db", "dump database started.");

    const result = await dumpDatabaseToFile(db, filePath);
    if (!result.ok) {
      return {
        success: false,
        message: "DBダンプが正常に終了しませんでした",
      };
    }

    logger.info("action:dump-db", "dump database ended.", result);

    return { success: true };
  } catch (error) {
    logger.error("action:dump-db", error);
    return { success: false, message: "DBダンプ中にエラーが発生しました" };
  }
}
