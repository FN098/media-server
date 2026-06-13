import { authorize } from "@/lib/authorization/authorize";
import { DB_BACKUP_DIR } from "@/lib/db-backup/config";
import { logger } from "@/lib/logger";
import { getMimetype } from "@/lib/media/mimetype";
import {
  badRequestResponse,
  internalServerErrorResponse,
  notFoundResponse,
} from "@/lib/response/errors";
import { existsPath } from "@/lib/utils/fs";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import fs from "fs";
import { NextRequest } from "next/server";
import path from "path";
import { Readable } from "stream";
import z from "zod";

const InputSchema = z.object({
  fileName: FileNameSchema.refine((name) => !name.includes("/"), {
    message: "Path separators are not allowed",
  })
    .refine((name) => !name.includes(".."), {
      message: "Parent directory references are not allowed",
    })
    .refine((name) => name.endsWith(".sql"), {
      message: "Must be a .sql file",
    }),
});

// DB バックアップファイルをダウンロードする
export async function GET(req: NextRequest) {
  // 入力バリデーション＋正規化
  const { searchParams } = req.nextUrl;
  const parsed = InputSchema.safeParse({
    fileName: searchParams.get("file"),
  });

  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: parsed.error.message,
    });
  }

  const { fileName } = parsed.data;

  // 認証＋認可
  const auth = await authorize("db-backup:download");
  if (!auth.success) {
    return auth;
  }

  // ファイルの物理パスを取得
  const filePath = path.join(DB_BACKUP_DIR, fileName);

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
    return new Response(webStream as ReadableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (error) {
    logger.error("api:db-backup-download", error);
    return internalServerErrorResponse();
  }
}
