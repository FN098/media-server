"use server";

import { authorize } from "@/lib/authorization/authorize";
import { restoreDatabaseFromFile } from "@/lib/child_process/mysql";
import { DB_BACKUP_DIR, TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { parseDatabaseURL } from "@/lib/db/url-parser";
import { getDatabaseUrlOrThrow } from "@/lib/env/env-server";
import { logger } from "@/lib/logger";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import path from "path";
import z from "zod";

const InputSchema = z.object({
  name: FileNameSchema.endsWith(".sql"),
  isTemp: z.boolean(),
});

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// DBリストア
export async function restoreDatabaseAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { name, isTemp } = parsed.data;

  // 認証＋認可
  const auth = await authorize("db-backup:restore");
  if (!auth.success) {
    return auth;
  }

  const filePath = isTemp
    ? path.join(TEMP_DB_BACKUP_DIR, name)
    : path.join(DB_BACKUP_DIR, name);

  const databaseUrl = getDatabaseUrlOrThrow();
  const db = parseDatabaseURL(databaseUrl);

  try {
    logger.info("action:db-restore", "restore database started.");

    const result = await restoreDatabaseFromFile(db, filePath);
    if (!result.ok) {
      return {
        success: false,
        message: "DBリストアが正常に終了しませんでした",
      };
    }

    logger.info("action:db-restore", "restore database ended:", result);
    return { success: true };
  } catch (error) {
    logger.error("action:db-restore", error);

    const message = isFsNotFoundError(error)
      ? "バックアップファイルが見つかりませんでした"
      : "DBリストア中にエラーが発生しました";

    return { success: false, message };
  }
}
