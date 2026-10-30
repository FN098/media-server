import { isSystemPath } from "@/feature/system/system-paths";
import { detectMediaType } from "@/lib/file/media-types";
import { findGlobalAdjacentFolder } from "@/lib/fs/fs-crawler";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";

export type FileType = "text" | "binary" | "image" | "video" | "audio";

export type FsNode =
  | {
      name: string; // ファイル名
      path: string; // ルートからの相対パス
      type: FileType | null;
      isDirectory: false;
      size: number;
      mtime: Date;
    }
  | {
      name: string; // フォルダ名
      path: string; // ルートからの相対パス
      isDirectory: true;
      mtime: Date;
    };

export type FsListing = {
  path: string; // 今見ているディレクトリ
  nodes: FsNode[];
  parentPath: string | null;
  prevPath: string | null;
  nextPath: string | null;
};

export interface FsContext {
  resolveRealPath: (virtualPath: string) => string;
  filterVirtualPath?: (virtualPath: string) => boolean;
}

export const defaultFsContext: FsContext = {
  resolveRealPath: (virtualPath) => resolveMediaPath(virtualPath),
  filterVirtualPath: (virtualPath) => !isSystemPath(virtualPath),
};

export async function listFsNodes(
  virtualDirPath: string,
  context: FsContext
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

      return isDirectory
        ? ({
            name: item.name,
            path: virtualPath,
            isDirectory: isDirectory,
            mtime: stat.mtime,
          } satisfies FsNode)
        : ({
            name: item.name,
            path: virtualPath,
            isDirectory: isDirectory,
            type: detectMediaType(item.name),
            size: stat.size,
            mtime: stat.mtime,
          } satisfies FsNode);
    })
  );

  return nodes;
}

export async function getFsNode(
  virtualPath: string,
  context: FsContext = { ...defaultFsContext }
): Promise<FsNode> {
  const vPath = virtualPath.replace(/\\/g, "/");
  const realPath = context.resolveRealPath(vPath);
  const stat = await fs.stat(realPath);
  const isDirectory = stat.isDirectory();
  const name = path.basename(vPath);

  return isDirectory
    ? {
        name: name,
        path: vPath,
        isDirectory,
        mtime: stat.mtime,
      }
    : {
        name: name,
        path: vPath,
        isDirectory,
        type: detectMediaType(name),
        size: stat.size,
        mtime: stat.mtime,
      };
}

export async function getFsListing(
  virtualDirPath: string,
  context: FsContext
): Promise<FsListing | null> {
  const realDirPath = context.resolveRealPath(virtualDirPath);

  if (!(await existsPath(realDirPath))) return null;

  // --- 現在のディレクトリのノード取得 ---
  const nodes = await listFsNodes(virtualDirPath, context);

  // --- 前後のディレクトリパスを取得 ---
  let prevPath: string | null = null;
  let nextPath: string | null = null;

  if (virtualDirPath !== "") {
    prevPath = await findGlobalAdjacentFolder(virtualDirPath, "prev", context);
    nextPath = await findGlobalAdjacentFolder(virtualDirPath, "next", context);
  }

  const parentPath =
    virtualDirPath === ""
      ? null
      : virtualDirPath.split("/").slice(0, -1).join("/") || null;

  const listing: FsListing = {
    path: virtualDirPath,
    nodes,
    parentPath,
    prevPath,
    nextPath,
  };

  return listing;
}
