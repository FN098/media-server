import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { UploadRequestSchema } from "@/lib/db-backup/schemas";
import { DbBackupUploadResult } from "@/lib/db-backup/types";
import { logger } from "@/lib/logger";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from "@/lib/response/errors";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// DB バックアップファイルをアップロードする
export async function POST(req: NextRequest) {
  // 入力バリデーション
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return badRequestResponse({
      code: "MISSING_REQUIRED_DATA",
      message: "file is required",
    });
  }

  const parsed = {
    form: UploadRequestSchema.safeParse({ file }),
  };
  if (!parsed.form.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST_DATA",
      message: parsed.form.error.issues[0].message,
    });
  }

  const validFile = parsed.form.data.file;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  // 認可
  if (!hasPermission(user, "db-backup:upload")) {
    return forbiddenResponse();
  }

  // 保存先パスの決定
  const newFileName = `upload_${uuidv4()}.sql`; // ユーザーから渡されたファイル名は使用しない（セキュリティのため）
  const savePath = path.join(TEMP_DB_BACKUP_DIR, newFileName);

  try {
    // 一時フォルダをアップロードの度にリセット（ストレージ節約のため）
    await fs.rm(TEMP_DB_BACKUP_DIR, { recursive: true, force: true });
    await fs.mkdir(TEMP_DB_BACKUP_DIR, { recursive: true });

    const buffer = Buffer.from(await validFile.arrayBuffer());
    await fs.writeFile(savePath, buffer);
  } catch (error) {
    logger.error("api:db-upload", error);
    return internalServerErrorResponse();
  }

  return NextResponse.json({
    success: true,
    backup: {
      name: newFileName,
      label: validFile.name,
      createdAt: new Date().toISOString(),
      size: validFile.size,
      isTemp: true,
    },
  } satisfies DbBackupUploadResult);
}
