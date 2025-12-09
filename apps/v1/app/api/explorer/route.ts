import { MEDIA_ROOT } from "@/app/lib/media/root";
import { detectMediaType } from "@/app/lib/media/type-detector";
import { MediaFsListing, MediaFsNode } from "@/app/lib/media/types";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const dirParam = req.nextUrl.searchParams.get("dir") ?? "";
    const targetDir = path.join(MEDIA_ROOT, dirParam);

    const dirents = await fs.readdir(targetDir, { withFileTypes: true });

    const nodes: MediaFsNode[] = await Promise.all(
      dirents.map(async (item) => {
        const relativePath = path.join(dirParam, item.name).replace(/\\/g, "/");

        const absolutePath = path.join(targetDir, item.name);

        const stat = await fs.stat(absolutePath);

        return {
          name: item.name,
          path: relativePath,
          isDirectory: item.isDirectory(),
          type: item.isDirectory() ? "directory" : detectMediaType(item.name),

          size: item.isDirectory() ? undefined : stat.size,
          updatedAt: stat.mtime.toISOString(),
        };
      })
    );

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
