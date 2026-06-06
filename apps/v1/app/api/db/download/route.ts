import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { getMimetype } from "@/lib/media/mimetype";
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse,
} from "@/lib/response/errors";
import { existsPath } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

// セキュリティ対策: ファイル名にスラッシュ等が含まれないかチェック（ディレクトリトラバーサル防止）
const SqlFileNameSchema = FileNameSchema.refine((v) => !v.includes("/"), {
  message: "Path separators are not allowed",
})
  .refine((v) => !v.includes(".."), {
    message: "Parent directory references are not allowed",
  })
  .refine((v) => v.endsWith(".sql"), {
    message: "Must be a .sql file",
  });

// DB バックアップファイルをダウンロードする
export async function GET(req: NextRequest) {
  // TODO: ユーザー認証・認可追加

  // 入力バリデーション
  const { searchParams } = req.nextUrl;
  const fileName = searchParams.get("file");

  if (!fileName) {
    return badRequestResponse({
      code: "MISSING_REQUIRED_PARAMETER",
      message: "file is required",
    });
  }

  const parsed = SqlFileNameSchema.safeParse(fileName);
  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_FILE_NAME",
      message: `Invalid file name: ${fileName}`,
    });
  }

  const validFileName = parsed.data;

  // ファイルの物理パスを取得
  const filePath = path.join(DB_BACKUP_DIR, validFileName);

  // ファイルの存在確認
  if (!(await existsPath(filePath))) {
    return notFoundResponse({
      code: "FILE_NOT_FOUND",
      message: "File not found",
    });
  }

  try {
    // ファイルを読み込みストリームとして作成
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream);

    // ファイルロックが解除されない問題の対策
    req.signal.addEventListener(
      "abort",
      () => {
        if (!fileStream.destroyed) {
          fileStream.destroy();
        }
      },
      { once: true }
    );
    fileStream.on("error", (err) => {
      console.error("Stream error:", err);
    });

    // レスポンスヘッダーの設定
    // ブラウザに「ダウンロード」として認識させる
    return new NextResponse(webStream as ReadableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${validFileName}"`,
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return internalServerErrorResponse();
  }
}
