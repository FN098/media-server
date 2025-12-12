import { detectMediaType } from "@/app/lib/media/mimetype";
import { MEDIA_ROOT } from "@/app/lib/media/root";
import { MediaFsListing, MediaFsNode } from "@/app/lib/media/types";
import fs from "fs/promises";
import path from "path";

export async function getMediaFsListing(
  targetPath: string
): Promise<MediaFsListing | null> {
  try {
    const targetDir = path.join(MEDIA_ROOT, targetPath);
    const dirents = await fs.readdir(targetDir, { withFileTypes: true });

    const nodes: MediaFsNode[] = await Promise.all(
      dirents.map(async (item) => {
        const relativePath = path
          .join(targetPath, item.name)
          .replace(/\\/g, "/");
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
      targetPath === ""
        ? null
        : targetPath.split("/").slice(0, -1).join("/") || "";

    const listing: MediaFsListing = {
      path: targetPath,
      nodes,
      parent,
    };

    return listing;
  } catch (e) {
    console.error(`Error in ${getMediaFsListing}:`, e);
    return null;
  }
}
