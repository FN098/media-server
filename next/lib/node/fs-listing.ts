import { findGlobalAdjacentFolder } from "@/lib/node/fs-crawler";
import { detectMediaType } from "@/lib/node/media-types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";

export type FileType = "image" | "video" | "audio";

export type FsNode = {
  name: string; // ファイル/フォルダ名
  path: string; // ルートからの相対パス
  fileType: FileType | null;
  isDirectory: boolean;
  size: number | null; // ディレクトリなら undefined
  mtime: Date;
};

export type FsListing = {
  path: string; // 今見ているディレクトリ
  nodes: FsNode[];
  parent: string | null;
  prev: string | null;
  next: string | null;
};

export interface MediaFsContext {
  resolveRealPath: (virtualPath: string) => string;
  filterVirtualPath?: (virtualPath: string) => boolean;
}

const defaultContext: MediaFsContext = {
  resolveRealPath: (virtualPath) => getServerMediaPath(virtualPath),
  filterVirtualPath: (virtualPath) => !isSystemHiddenVirtualPath(virtualPath),
};

export async function listFsNodes(
  virtualDirPath: string,
  context: MediaFsContext = { ...defaultContext }
): Promise<FsNode[]> {
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

  const nodes = await Promise.all(
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
        fileType: isDirectory ? null : detectMediaType(item.name),
        size: isDirectory ? null : stat.size,
        mtime: stat.mtime,
      } satisfies FsNode;
    })
  );

  return nodes;
}

export async function getFsNode(
  virtualFilePath: string,
  context: MediaFsContext = { ...defaultContext }
): Promise<FsNode> {
  const virtualPath = virtualFilePath.replace(/\\/g, "/");
  const realPath = context.resolveRealPath(virtualPath);
  const stat = await fs.stat(realPath);
  const isDirectory = stat.isDirectory();
  const fileName = path.basename(virtualPath);

  return {
    name: fileName,
    path: virtualPath,
    isDirectory,
    fileType: isDirectory ? null : detectMediaType(fileName),
    size: isDirectory ? null : stat.size,
    mtime: stat.mtime,
  };
}

export async function getFsListing(
  virtualDirPath: string,
  context: MediaFsContext = { ...defaultContext }
): Promise<FsListing | null> {
  const realDirPath = context.resolveRealPath(virtualDirPath);

  if (!(await existsPath(realDirPath))) return null;

  // --- 現在のディレクトリのノード取得 ---
  const nodes = await listFsNodes(virtualDirPath, context);

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

  const listing: FsListing = {
    path: virtualDirPath,
    nodes,
    parent,
    prev,
    next,
  };

  return listing;
}
