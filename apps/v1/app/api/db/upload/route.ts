import { TEMP_DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DbBackupUploadResult } from "@/lib/db-backup/types";
import { formatBytes } from "@/lib/utils/formatters";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const dbUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `最大サイズは ${formatBytes(MAX_FILE_SIZE)} です`
    )
    .refine(
      (file) => [".sql"].some((ext) => file.name.endsWith(ext)),
      ".sql ファイルのみアップロード可能です"
    ),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    const parsed = dbUploadSchema.safeParse({ file });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const validFile = parsed.data.file;
    const buffer = Buffer.from(await validFile.arrayBuffer());

    // --- 古い一時ファイルの削除とフォルダの再作成 ---
    // recursive: true で中身ごと削除、force: true で存在しなくてもエラーにしない
    await fs.rm(TEMP_DB_BACKUP_DIR, { recursive: true, force: true });
    // recursive: true で親ディレクトリ含めて確実に作成
    await fs.mkdir(TEMP_DB_BACKUP_DIR, { recursive: true });
    // --------------------------------------------

    // 一時ディレクトリに保存
    const tmpFileName = `upload_${uuidv4()}.sql`; // ユーザーから渡されたファイル名は使用しない（セキュリティのため）
    const tmpPath = path.join(TEMP_DB_BACKUP_DIR, tmpFileName);

    await fs.writeFile(tmpPath, buffer);

    return NextResponse.json({
      success: true,
      backup: {
        name: tmpFileName,
        label: validFile.name,
        createdAt: new Date().toISOString(),
        size: validFile.size,
        isTemp: true,
      },
    } satisfies DbBackupUploadResult);
  } catch (e) {
    console.error("upload db file error:", e);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
