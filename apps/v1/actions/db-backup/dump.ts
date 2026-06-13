"use server";

import { authorize } from "@/lib/authorization/authorize";
import { dumpDatabaseToFile } from "@/lib/child_process/mysqldump";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { parseDatabaseURL } from "@/lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
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

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const fileName = `backup_${timestamp}.sql`;
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
