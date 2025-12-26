import { existsDir } from "@/lib/fs";
import {
  DbMedia,
  MediaFsListing,
  MediaFsNode,
  MediaNode,
} from "@/lib/media/types";
import { getMediaPath } from "@/lib/path-helpers";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { detectMediaType, isMedia } from "./detector";

// そのディレクトリ「直下」にメディアがあるかチェック
async function hasDirectMedia(dirPath: string): Promise<boolean> {
  const absolutePath = getMediaPath(dirPath);
  if (!(await existsDir(absolutePath))) return false;

  const dirents = await fs.readdir(absolutePath, { withFileTypes: true });
  // ファイルかつメディアタイプであるものが1つでもあればOK
  return dirents.some(
    (e) => !e.isDirectory() && isMedia(detectMediaType(e.name))
  );
}

// 隣の有効なフォルダを探し、さらにその中を深く探索して「最初のメディアがあるフォルダ」を特定する
async function findDeepestMediaFolder(
  dirPath: string,
  priority: "first" | "last"
): Promise<string | null> {
  // 1. まずそのディレクトリ直下にメディアがあるか？
  if (await hasDirectMedia(dirPath)) {
    return dirPath;
  }

  // 2. 直下にないなら、子フォルダを探索
  const absolutePath = getMediaPath(dirPath);
  const dirents = await fs.readdir(absolutePath, { withFileTypes: true });
  const subDirs = dirents
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort(); // 名前順

  // 前に戻る時は「最後の子」から、次に進む時は「最初の子」から探す
  const targetDirs = priority === "last" ? subDirs.reverse() : subDirs;

  for (const name of targetDirs) {
    const subPath = path.join(dirPath, name).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(subPath, priority);
    if (found) return found;
  }

  return null;
}

// メインの探索ロジック
async function findAdjacentMediaFolder(
  parentPath: string,
  currentIndex: number,
  siblingDirNames: string[],
  direction: "prev" | "next"
): Promise<string | null> {
  const step = direction === "prev" ? -1 : 1;
  let i = currentIndex + step;

  while (i >= 0 && i < siblingDirNames.length) {
    const targetDirName = siblingDirNames[i];
    const targetPath = path.join(parentPath, targetDirName).replace(/\\/g, "/");

    // そのフォルダ配下で、最初に（または最後に）メディアが見つかる具体的なパスを探す
    const foundPath = await findDeepestMediaFolder(
      targetPath,
      direction === "prev" ? "last" : "first"
    );

    if (foundPath) return foundPath;
    i += step;
  }

  return null;
}

export async function getMediaFsListing(
  dirPath: string
): Promise<MediaFsListing | null> {
  try {
    const targetDir = getMediaPath(dirPath);
    if (!(await existsDir(targetDir))) return null;

    // --- 現在のディレクトリのノード取得 ---
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

    // --- 前後のディレクトリパスを取得 ---
    let prev: string | null = null;
    let next: string | null = null;

    if (dirPath !== "") {
      const parentPath = dirPath.split("/").slice(0, -1).join("/") || "";
      const parentTargetDir = getMediaPath(parentPath);
      const parentDirents = await fs.readdir(parentTargetDir, {
        withFileTypes: true,
      });

      const siblingDirs = parentDirents
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort(); // ここはUIのソート順と一致させる

      const currentDirName = dirPath.split("/").pop();
      const currentIndex = siblingDirs.indexOf(currentDirName!);

      if (currentIndex !== -1) {
        // 再帰的にメディアがある隣接フォルダを探す
        prev = await findAdjacentMediaFolder(
          parentPath,
          currentIndex,
          siblingDirs,
          "prev"
        );
        next = await findAdjacentMediaFolder(
          parentPath,
          currentIndex,
          siblingDirs,
          "next"
        );
      }
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
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getDbMedia(
  dirPath: string,
  userId: string
): Promise<DbMedia[]> {
  try {
    const dbMedia = await prisma.media.findMany({
      where: { dirPath },
      select: {
        path: true,
        title: true,
        fileMtime: true,
        fileSize: true,
        favorites: {
          where: { userId },
          select: { mediaId: true },
        },
      },
    });

    return dbMedia.map((m) => ({
      fileMtime: m.fileMtime,
      isFavorite: m.favorites.length > 0,
      path: m.path,
      fileSize: Number(m.fileSize),
      title: m.title ?? undefined,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getFavoriteMediaNodes(
  userId: string
): Promise<MediaNode[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        media: {
          select: {
            path: true,
            title: true,
            fileMtime: true,
            fileSize: true,
          },
        },
      },
      orderBy: {
        media: { path: "asc" },
      },
    });

    return favorites.map((f) => ({
      name: path.basename(f.media.path),
      path: f.media.path,
      type: detectMediaType(f.media.path),
      isDirectory: false,
      size: Number(f.media.fileSize),
      mtime: f.media.fileMtime,
      title: f.media.title ?? undefined,
      isFavorite: true,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
