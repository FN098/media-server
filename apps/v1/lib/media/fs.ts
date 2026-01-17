import { findGlobalAdjacentFolder } from "@/lib/media/fs-crawler";
import { detectMediaType } from "@/lib/media/media-types";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";
import { MediaFsContext, MediaFsListing, MediaFsNode } from "./types";

export async function getMediaFsNodes(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<MediaFsNode[]> {
  const realDirPath = context.resolveRealPath(virtualDirPath);
  const dirents = await fs.readdir(realDirPath, { withFileTypes: true });

  const filtered = dirents.filter((item) => {
    const virtualPath = path
      .join(virtualDirPath, item.name)
      .replace(/\\/g, "/");
    return context.filterVirtualPath
      ? context.filterVirtualPath(virtualPath)
      : true;
  });

  const nodes: MediaFsNode[] = await Promise.all(
    filtered.map(async (item) => {
      const virtualPath = path
        .join(virtualDirPath, item.name)
        .replace(/\\/g, "/");
      const realPath = path.join(realDirPath, item.name);
      const stat = await fs.stat(realPath);
      const isDirectory = stat.isDirectory();

      return {
        name: item.name,
        path: virtualPath,
        isDirectory: isDirectory,
        type: isDirectory ? "directory" : detectMediaType(item.name),
        size: isDirectory ? undefined : stat.size,
        mtime: stat.mtime,
      };
    })
  );

  return nodes;
}

export async function getMediaFsNode(
  virtualFilePath: string,
  context: MediaFsContext
): Promise<MediaFsNode> {
  const virtualPath = virtualFilePath.replace(/\\/g, "/");
  const realPath = context.resolveRealPath(virtualPath);
  const stat = await fs.stat(realPath);
  const isDirectory = stat.isDirectory();
  const fileName = path.basename(virtualPath);

  return {
    name: fileName,
    path: virtualPath,
    isDirectory: isDirectory,
    type: isDirectory ? "directory" : detectMediaType(fileName),
    size: isDirectory ? undefined : stat.size,
    mtime: stat.mtime,
  };
}

export async function getMediaFsListing(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<MediaFsListing | null> {
  const realDirPath = context.resolveRealPath(virtualDirPath);
  if (!(await existsPath(realDirPath))) return null;

  // --- 現在のディレクトリのノード取得 ---
  const nodes = await getMediaFsNodes(virtualDirPath, context);

  // --- 前後のディレクトリパスを取得 ---
  let prev: string | null = null;
  let next: string | null = null;

  if (virtualDirPath !== "") {
    prev = await findGlobalAdjacentFolder(virtualDirPath, "prev", context);
    next = await findGlobalAdjacentFolder(virtualDirPath, "next", context);
  }

  const parent =
    virtualDirPath === ""
      ? null
      : virtualDirPath.split("/").slice(0, -1).join("/") || "";

  const listing: MediaFsListing = {
    path: virtualDirPath,
    nodes,
    parent,
    prev,
    next,
  };

  return listing;
}
