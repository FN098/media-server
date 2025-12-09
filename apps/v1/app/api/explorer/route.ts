import { MEDIA_ROOT } from "@/app/lib/media-root";
import { detectMediaFsNodeType } from "@/app/lib/media-type";
import { MediaFsListing, MediaFsNode } from "@/app/types/media-fs";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const dirParam = req.nextUrl.searchParams.get("dir") ?? "";
    const targetDir = path.join(MEDIA_ROOT, dirParam);

    const dirents = await fs.readdir(targetDir, { withFileTypes: true });

    const nodes: MediaFsNode[] = dirents.map((item) => {
      const p = path.join(dirParam, item.name).replace(/\\/g, "/");

      return {
        name: item.name,
        path: p,
        isDirectory: item.isDirectory(),
        type: item.isDirectory()
          ? "directory"
          : detectMediaFsNodeType(item.name),
      };
    });

    const parent =
      dirParam === "" ? null : dirParam.split("/").slice(0, -1).join("/") || "";

    const listing: MediaFsListing = {
      path: dirParam,
      entries: nodes,
      parent,
    };

    return NextResponse.json(listing);
  } catch (e) {
    console.error("Internal Server Error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
