import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { getMimetype } from "@/lib/media/mimetype";
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse,
} from "@/lib/response/errors";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

// DB バックアップファイルをダウンロードする
export function GET(req: NextRequest) {
  // TODO: ユーザー認証・認可追加

  // 入力バリデーション
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("file");

  if (!fileName) {
    return badRequestResponse({
      code: "MISSING_REQUIRED_PARAMETER",
      message: "Missing required parameter: file",
    });
  }

  // セキュリティ対策: ファイル名にスラッシュ等が含まれないかチェック（ディレクトリトラバーサル防止）
  if (
    fileName.includes("/") ||
    fileName.includes("..") ||
    !fileName.endsWith(".sql") ||
    !FileNameSchema.safeParse(fileName).success
  ) {
    return badRequestResponse({
      code: "INVALID_FILE_NAME",
      message: `Invalid file name: ${fileName}`,
    });
  }

  // ファイルの物理パスを取得
  const filePath = path.join(DB_BACKUP_DIR, fileName);

  // ファイルの存在確認
  if (!fs.existsSync(filePath)) {
    return notFoundResponse({
      code: "FILE_NOT_FOUND",
      message: "ファイルが見つかりません",
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
      console.error("stream error", err);
    });

    // レスポンスヘッダーの設定
    // ブラウザに「ダウンロード」として認識させる
    return new NextResponse(webStream as ReadableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return internalServerErrorResponse();
  }
}
