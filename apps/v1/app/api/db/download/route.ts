import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { DownloadRequestSchema } from "@/lib/db-backup/schemas";
import { logger } from "@/lib/logger";
import { getMimetype } from "@/lib/media/mimetype";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/response/errors";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

// DB バックアップファイルをダウンロードする
export async function GET(req: NextRequest) {
  // 入力バリデーション
  const { searchParams } = req.nextUrl;
  const file = searchParams.get("file");

  if (!file) {
    return badRequestResponse({
      code: "MISSING_REQUIRED_PARAMETER",
      message: "file is required",
    });
  }

  const parsed = {
    params: DownloadRequestSchema.safeParse({ file }),
  };
  if (!parsed.params.success) {
    return badRequestResponse({
      code: "INVALID_FILE_NAME",
      message: `Invalid file name: ${file}`,
    });
  }

  const validFileName = parsed.params.data.file;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  // 認可
  if (!hasPermission(user, "db-backup:download")) {
    return forbiddenResponse();
  }

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
    fileStream.on("error", (error) => {
      logger.error("api:db-download:file-stream", error);
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
    logger.error("api:db-download", error);
    return internalServerErrorResponse();
  }
}
