import { MediaFsListing, MediaFsNode } from "@/lib/media/types";
import { getMediaPath } from "@/lib/path-helpers";
import fs from "fs/promises";
import path from "path";
import { detectMediaType } from "./media/detector";

export async function existsDir(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

export async function getMediaFsListing(
  dirPath: string
): Promise<MediaFsListing | null> {
  try {
    const targetDir = getMediaPath(dirPath);
    if (!(await existsDir(targetDir))) return null;

    const dirents = await fs.readdir(targetDir, { withFileTypes: true });

    const nodes: MediaFsNode[] = await Promise.all(
      dirents.map(async (item) => {
        const relativePath = path.join(dirPath, item.name).replace(/\\/g, "/");
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
      dirPath === "" ? null : dirPath.split("/").slice(0, -1).join("/") || "";

    const listing: MediaFsListing = {
      path: dirPath,
      nodes,
      parent,
    };

    return listing;
  } catch (e) {
    console.error(e);
    return null;
  }
}
