import { TEMP_BACKUP_DIR } from "@/lib/db/const";
import { dbUploadSchema } from "@/lib/db/schemas";
import { DbUploadResponse } from "@/lib/db/types";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    const validated = dbUploadSchema.safeParse({ file });
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedFile = validated.data.file;
    const buffer = Buffer.from(await validatedFile.arrayBuffer());

    // --- 古い一時ファイルの削除とフォルダの再作成 ---
    // recursive: true で中身ごと削除、force: true で存在しなくてもエラーにしない
    await fs.rm(TEMP_BACKUP_DIR, { recursive: true, force: true });
    // recursive: true で親ディレクトリ含めて確実に作成
    await fs.mkdir(TEMP_BACKUP_DIR, { recursive: true });
    // --------------------------------------------

    // 一時ディレクトリに保存
    const tmpFileName = `upload_${uuidv4()}.sql`;
    const tmpPath = path.join(TEMP_BACKUP_DIR, tmpFileName);

    await fs.writeFile(tmpPath, buffer);

    return NextResponse.json({
      success: true,
      backup: {
        name: tmpFileName,
        label: validatedFile.name,
        createdAt: new Date().toISOString(),
        size: validatedFile.size,
        isTemp: true,
      },
    } satisfies DbUploadResponse);
  } catch (e) {
    console.error("upload db file error:", e);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
