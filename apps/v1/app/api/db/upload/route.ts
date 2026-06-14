import { authorize } from "@/lib/authorization/authorize";
import {
  MAX_UPLOAD_FILE_SIZE,
  TEMP_DB_BACKUP_DIR,
} from "@/lib/db-backup/config";
import { buildDbUploadFileName } from "@/lib/db-backup/filename";
import { DbBackupFile } from "@/lib/db-backup/types";
import { logger } from "@/lib/logger";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} from "@/lib/response/errors";
import { formatBytes } from "@/lib/utils/bytes";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";
import z from "zod";

const InputSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_UPLOAD_FILE_SIZE, {
      message: `File size must not exceed ${formatBytes(MAX_UPLOAD_FILE_SIZE)}`,
    })
    .refine((file) => file.name.endsWith(".sql"), {
      message: "Must be a .sql file",
    }),
});

export type DbBackupUploadResult =
  | {
      success: true;
      backup: DbBackupFile;
    }
  | {
      success: false;
      error: string;
    };

// DB バックアップファイルをアップロードする
export async function POST(req: NextRequest) {
  // 入力バリデーション
  const formData = await req.formData();
  const parsed = InputSchema.safeParse({
    file: formData.get("file"),
  });

  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: parsed.error.message,
    });
  }

  const { file } = parsed.data;

  // 認証＋認可
  const auth = await authorize("db-backup:upload");
  if (!auth.success) {
    return forbiddenResponse();
  }

  // 保存先パスの決定
  const newFileName = buildDbUploadFileName();
  const savePath = path.join(TEMP_DB_BACKUP_DIR, newFileName);

  try {
    // 一時フォルダをアップロードの度にリセット（ストレージ節約のため）
    await fs.rm(TEMP_DB_BACKUP_DIR, { recursive: true, force: true });
    await fs.mkdir(TEMP_DB_BACKUP_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(savePath, buffer);

    return Response.json({
      success: true,
      backup: {
        name: newFileName,
        label: file.name,
        createdAt: new Date().toISOString(),
        size: file.size,
        isTemp: true,
      },
    } satisfies DbBackupUploadResult);
  } catch (error) {
    logger.error("api:db-upload", error);
    return internalServerErrorResponse();
  }
}
