import { findGlobalAdjacentFolder } from "@/lib/media/fs-route";
import { detectMediaType } from "@/lib/media/media-types";
import { getMediaPath } from "@/lib/path/helpers";
import { existsDir } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";
import { MediaFsListing, MediaFsNode } from "./types";

export async function getMediaFsNodes(dirPath: string): Promise<MediaFsNode[]> {
  const targetDir = getMediaPath(dirPath);
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

  return nodes;
}

export async function getMediaFsNode(filePath: string): Promise<MediaFsNode> {
  const absolutePath = getMediaPath(filePath);
  const stat = await fs.stat(absolutePath);
  const isDirectory = stat.isDirectory();
  const fileName = path.basename(filePath);

  return {
    name: fileName,
    path: filePath.replace(/\\/g, "/"),
    isDirectory: isDirectory,
    type: isDirectory ? "directory" : detectMediaType(fileName),
    size: isDirectory ? undefined : stat.size,
    mtime: stat.mtime,
  };
}

export async function getMediaFsListing(
  dirPath: string
): Promise<MediaFsListing | null> {
  const targetDir = getMediaPath(dirPath);
  if (!(await existsDir(targetDir))) return null;

  // --- 現在のディレクトリのノード取得 ---
  const nodes = await getMediaFsNodes(dirPath);

  // --- 前後のディレクトリパスを取得 ---
  let prev: string | null = null;
  let next: string | null = null;

  if (dirPath !== "") {
    prev = await findGlobalAdjacentFolder(dirPath, "prev");
    next = await findGlobalAdjacentFolder(dirPath, "next");
  }

  const parent =
    dirPath === "" ? null : dirPath.split("/").slice(0, -1).join("/") || "";

  const listing: MediaFsListing = {
    path: dirPath,
    nodes,
    parent,
    prev,
    next,
  };

  return listing;
}
