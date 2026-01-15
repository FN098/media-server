import { detectMediaType, isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import { isBlockedVirtualPath } from "@/lib/path/blacklist";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";

// そのディレクトリ「直下」にメディアがあるかチェック
async function hasDirectMedia(dirPath: string): Promise<boolean> {
  const absolutePath = getServerMediaPath(dirPath);
  if (!(await existsPath(absolutePath))) return false;

  const dirents = await fs.readdir(absolutePath, { withFileTypes: true });
  // ファイルかつメディアタイプであるものが1つでもあればOK
  return dirents.some(
    (e) => !e.isDirectory() && isMedia(detectMediaType(e.name))
  );
}

// そのディレクトリ直下のサブディレクトリを名前順に取得
async function getSubDirs(dirPath: string): Promise<string[]> {
  const absolutePath = getServerMediaPath(dirPath);
  if (!(await existsPath(absolutePath))) return [];
  const dirents = await fs.readdir(absolutePath, { withFileTypes: true });
  return sortNames(
    dirents
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter(
        (name) =>
          !isBlockedVirtualPath(path.join(dirPath, name).replace(/\\/g, "/"))
      )
  );
}

// 隣の有効なフォルダを探し、さらにその中を深く探索して「最初のメディアがあるフォルダ」を特定する
async function findDeepestMediaFolder(
  dirPath: string,
  priority: "first" | "last"
): Promise<string | null> {
  // ブラックリストは探索しない
  if (isBlockedVirtualPath(dirPath)) return null;

  // 1. Next(first)なら、まず自分自身の直下をチェック
  if (priority === "first") {
    if (await hasDirectMedia(dirPath)) return dirPath;
  }

  // 2. 子フォルダを探索
  const subDirs = await getSubDirs(dirPath);
  const targetDirs = priority === "last" ? [...subDirs].reverse() : subDirs;

  for (const name of targetDirs) {
    const subPath = path.join(dirPath, name).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(subPath, priority);
    if (found) return found;
  }

  // 3. Prev(last)なら、子を全部見た後に自分自身をチェック
  if (priority === "last") {
    if (await hasDirectMedia(dirPath)) return dirPath;
  }

  return null;
}

export async function findGlobalNextFolder(
  currentPath: string
): Promise<string | null> {
  // 1. まず、自分の「子」の中にメディアがないか探す
  const subDirs = await getSubDirs(currentPath);
  for (const name of subDirs) {
    const subPath = path.join(currentPath, name).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(subPath, "first");
    if (found) return found;
  }

  // 2. 子になければ、「親の階層」に上がって、自分の「次の兄弟」を探す
  return findNextStepUpward(currentPath);
}

async function findNextStepUpward(currentPath: string): Promise<string | null> {
  const parentPath =
    currentPath.split("/").slice(0, -1).join("/") ||
    (currentPath === "" ? null : "");
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath);
  const currentDirName = currentPath.split("/").pop();
  const currentIndex = siblings.indexOf(currentDirName!);

  // 自分の次の兄弟から順に探索
  for (let i = currentIndex + 1; i < siblings.length; i++) {
    const targetPath = path.join(parentPath, siblings[i]).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(targetPath, "first");
    if (found) return found;
  }

  // 自分の兄弟にもいなければ、さらに親の階層へ
  return findNextStepUpward(parentPath);
}

export async function findGlobalPrevFolder(
  currentPath: string
): Promise<string | null> {
  const parentPath =
    currentPath.split("/").slice(0, -1).join("/") ||
    (currentPath === "" ? null : "");
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath);
  const currentDirName = currentPath.split("/").pop();
  const currentIndex = siblings.indexOf(currentDirName!);

  // 1. 自分の「前の兄弟」がいれば、その中の「最後(last)」のメディアを探す
  for (let i = currentIndex - 1; i >= 0; i--) {
    const targetPath = path.join(parentPath, siblings[i]).replace(/\\/g, "/");
    const found = await findDeepestMediaFolder(targetPath, "last");
    if (found) return found;
  }

  // 2. 前の兄弟がいなければ、「親自身」がメディアを持っているか確認
  if (parentPath !== "" && (await hasDirectMedia(parentPath))) {
    return parentPath;
  }

  // 3. 親もダメなら、さらに親の階層へ
  return findGlobalPrevFolder(parentPath);
}

// 指定されたフォルダの「次」または「前」にある、メディアを持つフォルダを
// 階層を遡りながら（親の兄弟、そのまた親の兄弟...）再帰的に探す
export async function findGlobalAdjacentFolder(
  currentPath: string,
  direction: "prev" | "next"
): Promise<string | null> {
  if (direction === "next") return findGlobalNextFolder(currentPath);
  return findGlobalPrevFolder(currentPath);
}
