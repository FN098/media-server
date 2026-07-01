"use server";

import { authorize } from "@/lib/authorization/authorize";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { logger } from "@/lib/logger";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs/promises";
import path from "path";
import z from "zod";

const InputSchema = z.object({
  name: FileNameSchema.endsWith(".sql"),
});

type ActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

// バックアップファイルの削除
/** @deprecated 未使用 */
export async function deleteBackupAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { name } = parsed.data;

  // 認証＋認可
  const auth = await authorize("db-backup:delete");
  if (!auth.success) {
    return auth;
  }

  const filePath = path.join(DB_BACKUP_DIR, name);

  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    logger.error("action:delete-db-backup", error);

    const message = isFsNotFoundError(error)
      ? "バックアップファイルが見つかりませんでした。"
      : "バックアップファイルの削除に失敗しました。";

    return { success: false, message };
  }
}
