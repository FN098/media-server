"use server";

import { authorize } from "@/lib/authorization/authorize";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { listSqlFiles } from "@/lib/db-backup/fs";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";
import z from "zod";

const InputSchema = z.object({
  keepCount: z.number().min(5).max(100).optional().default(10),
});

type ActionResult =
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
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { keepCount } = parsed.data;

  // 認証＋認可
  const auth = await authorize("db-backup:cleanup");
  if (!auth.success) {
    return auth;
  }

  const files = await listSqlFiles(DB_BACKUP_DIR);

  // 新しい順にソート
  const sorted = files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  // 規定数を超えたファイルを削除
  const filesToDelete = sorted.slice(keepCount);

  try {
    for (const file of filesToDelete) {
      await fs.unlink(path.join(DB_BACKUP_DIR, file.name));
      logger.info(
        "action:db-backup-cleanup",
        `Deleted old backup: ${file.name}`
      );
    }
    return { success: true, deletedCount: filesToDelete.length };
  } catch (error) {
    logger.error("action:cleanup-db-backup", error);
    return {
      success: false,
      message: "古いバックアップファイルのクリーンアップに失敗しました",
    };
  }
}
