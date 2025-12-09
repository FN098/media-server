import { getMimetype } from "@/app/lib/media/mimetype";
import { MEDIA_ROOT } from "@/app/lib/media/root";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: p } = await context.params;

    const rel = p.join("/");
    const filePath = path.join(MEDIA_ROOT, rel);

    const data = await fs.readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (e) {
    console.error("Internal Server Error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
