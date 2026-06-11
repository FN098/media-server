import { detectMediaType, isMedia } from "@/lib/media/detectors";
import { sortNodes } from "@/lib/media/sort";
import { CachedFsEntry, MediaFsContext } from "@/lib/media/types";
import { basename, join, parentpath } from "@/lib/virtual-path/path";
import { Dirent } from "fs";
import { readdir } from "fs/promises";

async function readVirtualDirCached(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<CachedFsEntry[]> {
  if (!context.dirCache) {
    context.dirCache = new Map();
  }

  const cached = context.dirCache.get(virtualDirPath);
  if (cached !== undefined) {
    return cached;
  }

  const realDirPath = context.resolveRealPath(virtualDirPath);

  let dirents: Dirent[];
  try {
    dirents = await readdir(realDirPath, { withFileTypes: true });
  } catch {
    context.dirCache.set(virtualDirPath, []);
    return [];
  }

  const entries: CachedFsEntry[] = dirents.map((e) => {
    const virtualPath = join(virtualDirPath, e.name);
    const isDirectory = e.isDirectory();
    const _isMedia = isDirectory ? false : isMedia(detectMediaType(e.name));
    return {
      virtualPath,
      name: e.name,
      isDirectory,
      isMedia: _isMedia,
    };
  });

  context.dirCache.set(virtualDirPath, entries);
  return entries;
}

// そのディレクトリ「直下」にメディアがあるかチェック
async function hasDirectMedia(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<boolean> {
  const entries = await readVirtualDirCached(virtualDirPath, context);
  return entries.some((e) => e.isMedia);
}

// そのディレクトリ直下のサブディレクトリを名前順に取得
async function getSubDirs(
  virtualDirPath: string,
  context: MediaFsContext
): Promise<CachedFsEntry[]> {
  const entries = await readVirtualDirCached(virtualDirPath, context);

  return sortNodes(
    entries
      .filter((e) => e.isDirectory)
      .filter((e) => context.filterVirtualPath?.(e.virtualPath) ?? true)
  );
}

// 隣の有効なフォルダを探し、さらにその中を深く探索して「最初のメディアがあるフォルダ」を特定する (DFS)
async function findDeepestMediaFolder(
  virtualDirPath: string,
  priority: "first" | "last",
  context: MediaFsContext
): Promise<string | null> {
  if (context.filterVirtualPath?.(virtualDirPath) === false) {
    return null;
  }

  // Next(first) なら、自分→子の順にチェック
  if (priority === "first") {
    if (await hasDirectMedia(virtualDirPath, context)) return virtualDirPath;

    // 昇順
    const subDirs = await getSubDirs(virtualDirPath, context);
    for (let i = 0; i < subDirs.length; i++) {
      const dir = subDirs[i];
      const subPath = dir.virtualPath;
      const found = await findDeepestMediaFolder(subPath, priority, context);
      if (found) return found;
    }
  }

  // Prev(last) なら、子→自分の順にチェック
  if (priority === "last") {
    // 降順
    const subDirs = await getSubDirs(virtualDirPath, context);
    for (let i = subDirs.length - 1; i >= 0; i--) {
      const dir = subDirs[i];
      const subPath = dir.virtualPath;
      const found = await findDeepestMediaFolder(subPath, priority, context);
      if (found) return found;
    }

    if (await hasDirectMedia(virtualDirPath, context)) return virtualDirPath;
  }

  return null;
}

// 次のフォルダを探索
async function findGlobalNextFolder(
  currentVirtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  // 1. まず、自分の「子」の中にメディアがないか探す
  const subDirs = await getSubDirs(currentVirtualDirPath, context);
  for (const dir of subDirs) {
    const subPath = dir.virtualPath;
    const found = await findDeepestMediaFolder(subPath, "first", context);
    if (found) return found;
  }

  // 2. 子になければ、「親の階層」に上がって、自分の「次の兄弟」を探す
  return findNextStepUpward(currentVirtualDirPath, context);
}

async function findNextStepUpward(
  currentVirtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  const parentPath = parentpath(currentVirtualDirPath);
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath, context);
  const currentDirName = basename(currentVirtualDirPath);
  const currentIndex = siblings.findIndex((e) => e.name === currentDirName);

  // 自分の次の兄弟から順に探索
  for (let i = currentIndex + 1; i < siblings.length; i++) {
    const targetPath = siblings[i].virtualPath;
    const found = await findDeepestMediaFolder(targetPath, "first", context);
    if (found) return found;
  }

  // 自分の兄弟にもいなければ、さらに親の階層へ
  return findNextStepUpward(parentPath, context);
}

// 前のフォルダを探索
async function findGlobalPrevFolder(
  currentVirtualDirPath: string,
  context: MediaFsContext
): Promise<string | null> {
  const parentPath = parentpath(currentVirtualDirPath);
  if (parentPath === null) return null;

  const siblings = await getSubDirs(parentPath, context);
  const currentDirName = basename(currentVirtualDirPath);
  const currentIndex = siblings.findIndex((e) => e.name === currentDirName);

  // 1. 自分の「前の兄弟」がいれば、その中の「最後(last)」のメディアを探す
  for (let i = currentIndex - 1; i >= 0; i--) {
    const targetPath = siblings[i].virtualPath;
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
