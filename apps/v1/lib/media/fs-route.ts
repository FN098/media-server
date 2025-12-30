import { detectMediaType, isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import { getMediaPath } from "@/lib/path/helpers";
import { existsDir } from "@/lib/utils/fs";
import fs from "fs/promises";
import path from "path";

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

  // フォルダのみ抽出し、自然順でソート
  const subDirs = sortNames(
    dirents.filter((e) => e.isDirectory()).map((e) => e.name)
  );

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

// 指定されたフォルダの「次」または「前」にある、メディアを持つフォルダを
// 階層を遡りながら（親の兄弟、そのまた親の兄弟...）再帰的に探す
export async function findGlobalAdjacentFolder(
  currentPath: string,
  direction: "prev" | "next"
): Promise<string | null> {
  if (currentPath === "") return null; // ルートまで到達したら終了

  const parentPath = currentPath.split("/").slice(0, -1).join("/") || "";
  const parentTargetDir = getMediaPath(parentPath);

  if (!(await existsDir(parentTargetDir))) return null;

  const parentDirents = await fs.readdir(parentTargetDir, {
    withFileTypes: true,
  });

  // 兄弟フォルダを自然順でソート
  const siblingDirs = sortNames(
    parentDirents.filter((d) => d.isDirectory()).map((d) => d.name)
  );

  const currentDirName = currentPath.split("/").pop();
  const currentIndex = siblingDirs.indexOf(currentDirName!);

  // 1. まず同じ階層の兄弟から探す
  const foundInSiblings = await findAdjacentMediaFolder(
    parentPath,
    currentIndex,
    siblingDirs,
    direction
  );

  if (foundInSiblings) return foundInSiblings;

  // 2. 兄弟に見つからなければ、さらに上の階層（親の隣）を探しに行く
  return findGlobalAdjacentFolder(parentPath, direction);
}
