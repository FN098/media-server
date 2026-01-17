import { detectMediaType, isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import { MediaFsContext } from "@/lib/media/types";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";

// そのディレクトリ「直下」にメディアがあるかチェック
async function hasDirectMedia(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<boolean> {
  const realPath = context.resolveRealPath(virtualDirPath);
  if (!(await existsPath(realPath))) return false;

  const dirents = await fs.readdir(realPath, { withFileTypes: true });
  // ファイルかつメディアタイプであるものが1つでもあればOK
  return dirents.some(
    (e) => !e.isDirectory() && isMedia(detectMediaType(e.name))
  );
}

// そのディレクトリ直下のサブディレクトリを名前順に取得
async function getSubDirs(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<string[]> {
  const realPath = context.resolveRealPath(virtualDirPath);
  if (!(await existsPath(realPath))) return [];

  const dirents = await fs.readdir(realPath, { withFileTypes: true });

  return sortNames(
    dirents
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => {
        const virtualPath = path.join(virtualDirPath, name).replace(/\\/g, "/");
        return context.filterVirtualPath
          ? context.filterVirtualPath(virtualPath)
          : true;
      })
  );
}

// 隣の有効なフォルダを探し、さらにその中を深く探索して「最初のメディアがあるフォルダ」を特定する
async function findDeepestMediaFolder(
  virtualDirPath: string,
  priority: "first" | "last",
  context: MediaFsContext
): Promise<string | null> {
  if (context.filterVirtualPath && !context.filterVirtualPath(virtualDirPath)) {
    return null;
  }

  // 1. Next(first)なら、まず自分自身の直下をチェック
  if (priority === "first") {
    if (await hasDirectMedia(virtualDirPath, context)) return virtualDirPath;
  }

  // 2. 子フォルダを探索
  const subDirs = await getSubDirs(virtualDirPath, context);
  const targetDirs = priority === "last" ? [...subDirs].reverse() : subDirs;

  for (const name of targetDirs) {
    const subPath = path.join(virtualDirPath, name).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(subPath, priority, context);
    if (found) return found;
  }

  // 3. Prev(last)なら、子を全部見た後に自分自身をチェック
  if (priority === "last") {
    if (await hasDirectMedia(virtualDirPath, context)) return virtualDirPath;
  }

  return null;
}

async function findGlobalNextFolder(
  currentVirtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  // 1. まず、自分の「子」の中にメディアがないか探す
  const subDirs = await getSubDirs(currentVirtualDirPath, context);
  for (const name of subDirs) {
    const subPath = path.join(currentVirtualDirPath, name).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(subPath, "first", context);
    if (found) return found;
  }

  // 2. 子になければ、「親の階層」に上がって、自分の「次の兄弟」を探す
  return findNextStepUpward(currentVirtualDirPath, context);
}

async function findNextStepUpward(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  const parentPath =
    virtualDirPath.split("/").slice(0, -1).join("/") ||
    (virtualDirPath === "" ? null : "");
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath, context);
  const currentDirName = virtualDirPath.split("/").pop();
  const currentIndex = siblings.indexOf(currentDirName!);

  // 自分の次の兄弟から順に探索
  for (let i = currentIndex + 1; i < siblings.length; i++) {
    const targetPath = path.join(parentPath, siblings[i]).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(targetPath, "first", context);
    if (found) return found;
  }

  // 自分の兄弟にもいなければ、さらに親の階層へ
  return findNextStepUpward(parentPath, context);
}

async function findGlobalPrevFolder(
  currentVirtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  const parentPath =
    currentVirtualDirPath.split("/").slice(0, -1).join("/") ||
    (currentVirtualDirPath === "" ? null : "");
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath, context);
  const currentDirName = currentVirtualDirPath.split("/").pop();
  const currentIndex = siblings.indexOf(currentDirName!);

  // 1. 自分の「前の兄弟」がいれば、その中の「最後(last)」のメディアを探す
  for (let i = currentIndex - 1; i >= 0; i--) {
    const targetPath = path.join(parentPath, siblings[i]).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(targetPath, "last", context);
    if (found) return found;
  }

  // 2. 前の兄弟がいなければ、「親自身」がメディアを持っているか確認
  if (parentPath !== "" && (await hasDirectMedia(parentPath, context))) {
    return parentPath;
  }

  // 3. 親もダメなら、さらに親の階層へ
  return findGlobalPrevFolder(parentPath, context);
}

// 指定されたフォルダの「次」または「前」にある、メディアを持つフォルダを
// 階層を遡りながら（親の兄弟、そのまた親の兄弟...）再帰的に探す
export async function findGlobalAdjacentFolder(
  currentVirtualPath: string,
  direction: "prev" | "next",
  context: MediaFsContext
): Promise<string | null> {
  if (direction === "next") {
    return findGlobalNextFolder(currentVirtualPath, context);
  }
  return findGlobalPrevFolder(currentVirtualPath, context);
}
