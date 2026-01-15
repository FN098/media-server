import { getMimetype } from "@/lib/media/mimetype";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isErrnoException } from "@/lib/utils/error";
import fsSync from "fs";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: p } = await context.params;
    const rel = p.join("/");
    const filePath = getServerMediaPath(rel);

    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch (e: unknown) {
      if (isErrnoException(e) && e.code === "ENOENT") {
        return new NextResponse("File not found", { status: 404 });
      }
      throw e;
    }
    const fileSize = stat.size;

    // ---- Range リクエスト ----
    const range = req.headers.get("Range");
    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        return new NextResponse("Invalid Range", { status: 416 });
      }

      const truncate = (n: number) => Math.max(0, Math.min(n, fileSize - 1));
      const start = match[1] ? truncate(Number(match[1])) : 0;
      const end = match[2] ? truncate(Number(match[2])) : fileSize - 1;

      if (start >= fileSize || start > end) {
        return new NextResponse("Range Not Satisfiable", { status: 416 });
      }

      const chunkSize = end - start + 1;

      const fileStream = fsSync.createReadStream(filePath, {
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

      return new NextResponse(webStream as ReadableStream, {
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
    const fileStream = fsSync.createReadStream(filePath);
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

    return new NextResponse(webStream as ReadableStream, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
