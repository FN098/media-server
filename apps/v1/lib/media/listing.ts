import { existsDir } from "@/lib/fs";
import { DbMedia, MediaFsListing, MediaFsNode } from "@/lib/media/types";
import { getMediaPath } from "@/lib/path-helpers";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { detectMediaType } from "./detector";

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
          mtime: stat.mtime,
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

export async function getDbMedia(dirPath: string): Promise<DbMedia[]> {
  try {
    const dbMedia = await prisma.media.findMany({
      where: { dirPath },
      select: {
        path: true,
        title: true,
        fileMtime: true,
        fileSize: true,
        favorites: {
          select: {
            mediaId: true,
          },
        },
      },
    });

    return dbMedia.map((m) => ({
      fileMtime: m.fileMtime,
      isFavorite: m.favorites != null,
      path: m.path,
      fileSize: Number(m.fileSize),
      title: m.title ?? undefined,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
