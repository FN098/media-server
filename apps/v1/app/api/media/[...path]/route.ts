import { getMimetype } from "@/app/lib/media/mimetype";
import { MEDIA_ROOT } from "@/app/lib/media/root";
import fsSync from "fs";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: p } = await context.params;
    const rel = p.join("/");
    const filePath = path.join(MEDIA_ROOT, rel);

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;

    // ---- Range リクエスト ----
    const range = req.headers.get("Range");
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      const chunkSize = end - start + 1;

      const fileStream = fsSync.createReadStream(filePath, {
        start,
        end,
      });
      const webStream = Readable.toWeb(fileStream);

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
    return new NextResponse(webStream as ReadableStream, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (e) {
    console.error("Internal Server Error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
