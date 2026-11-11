import { getMimetype } from "@/lib/_old/node/mimetype";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  notFoundResponse,
} from "@/lib/_old/response/errors";
import { authorize } from "@/lib/authorization/authorize";
import { getFilePath } from "@/lib/file/repository";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { getPathInfo } from "@/lib/utils/fs";
import { createReadStream } from "fs";
import { Readable } from "stream";
import z from "zod";

const requestSchema = z.object({
  id: z.uuid(),
});

// ファイルダウンロード
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 入力バリデーション＋正規化
  const { id } = await context.params;

  const parsed = requestSchema.safeParse({
    id,
  });

  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: parsed.error.issues[0].message,
    });
  }

  const { id: fileId } = parsed.data;

  // 認証＋認可
  const auth = await authorize("download-file");
  if (!auth.success) {
    return forbiddenResponse();
  }

  // ファイルID → 物理パス
  const virtualPath = await getFilePath(fileId);
  const filePath = resolveMediaPath(virtualPath);

  const fileInfo = await getPathInfo(filePath);
  if (!fileInfo.exists) {
    if (fileInfo.error === "not-found") {
      return notFoundResponse();
    } else {
      return forbiddenResponse();
    }
  }
  if (fileInfo.isDirectory) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: "not file",
    });
  }

  const fileSize = fileInfo.size;

  try {
    // ---- Range リクエスト ----
    const range = req.headers.get("Range");
    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        return new Response("Invalid Range", { status: 416 });
      }

      const truncate = (n: number) => Math.max(0, Math.min(n, fileSize - 1));
      const start = match[1] ? truncate(Number(match[1])) : 0;
      const end = match[2] ? truncate(Number(match[2])) : fileSize - 1;

      if (start >= fileSize || start > end) {
        return new Response("Range Not Satisfiable", { status: 416 });
      }

      const chunkSize = end - start + 1;

      const fileStream = createReadStream(filePath, {
        start,
        end,
      });
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

      return new Response(webStream as ReadableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": getMimetype(filePath),
        },
      });
    }

    // ---- 通常リクエスト ----
    const fileStream = createReadStream(filePath);
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

    return new Response(webStream as ReadableStream, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (error) {
    logger.error("download-file-api", error);
    return internalServerErrorResponse();
  }
}
