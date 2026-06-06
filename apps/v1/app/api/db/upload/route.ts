import { TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupUploadResult } from "@/lib/db-backup/types";
import {
  badRequestResponse,
  internalServerErrorResponse,
} from "@/lib/response/errors";
import { formatBytes } from "@/lib/utils/bytes";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

// TODO: ユーザー認証・認可追加

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UploadRequestSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must not exceed ${formatBytes(MAX_FILE_SIZE)}`,
    })
    .refine((file) => [".sql"].some((ext) => file.name.endsWith(ext)), {
      message: "Must be a .sql file",
    }),
});

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

  const parsed = UploadRequestSchema.safeParse({ file });
  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST_DATA",
      message: parsed.error.issues[0].message,
    });
  }

  const validFile = parsed.data.file;

  // 一時フォルダをアップロードの度にリセット（ストレージ節約のため）
  await fs.rm(TEMP_DB_BACKUP_DIR, { recursive: true, force: true });
  await fs.mkdir(TEMP_DB_BACKUP_DIR, { recursive: true });

  // 保存先パスの決定
  const newFileName = `upload_${uuidv4()}.sql`; // ユーザーから渡されたファイル名は使用しない（セキュリティのため）
  const savePath = path.join(TEMP_DB_BACKUP_DIR, newFileName);

  try {
    const buffer = Buffer.from(await validFile.arrayBuffer());
    await fs.writeFile(savePath, buffer);

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
  } catch (e) {
    console.error("Upload error:", e);
    return internalServerErrorResponse();
  }
}
