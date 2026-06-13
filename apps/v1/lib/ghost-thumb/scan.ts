import { APP_CONFIG } from "@/app.config";
import { AbortError, isAbortError } from "@/lib/errors/abort-error";
import {
  GhostThumbItem,
  GhostThumbScanEventData,
} from "@/lib/ghost-thumb/types";
import { getMediaPathFromThumbPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { db } from "@/lib/prisma";
import { sanitize } from "@/lib/virtual-path/guard";
import { glob } from "glob/raw";
import path from "path";

const MAX_GHOST_ITEMS = 10000;

export function scanGhostThumb(
  send: (data: GhostThumbScanEventData) => void,
  signal: AbortSignal,
  fullScan: boolean
) {
  if (fullScan) {
    return runFullScan(send, signal);
  } else {
    return runQuickScan(send, signal);
  }
}

// フルスキャン (ファイル単位)
async function runFullScan(
  send: (data: GhostThumbScanEventData) => void,
  signal: AbortSignal
): Promise<GhostThumbItem[]> {
  const ghostItems: GhostThumbItem[] = [];

  // FS 上の全サムネイルファイルを取得
  const thumbRoot = path.resolve(PATHS.server.media.thumb.root);
  const allThumbFiles = await glob("**/*" + APP_CONFIG.thumb.extension, {
    cwd: thumbRoot,
    absolute: true,
    nodir: true,
  });

  const total = allThumbFiles.length;
  if (total === 0 || signal.aborted) return [];

  const batchSize = 50;

  // DB 上の全ファイルパスを取得
  const allMedia = await db.media.findMany({ select: { path: true } });
  const validPaths = new Set(allMedia.map((m) => m.path));

  try {
    for (let i = 0; i < total; i += batchSize) {
      if (signal.aborted) throw new AbortError();

      const batch = allThumbFiles.slice(i, i + batchSize);
      for (const fullPath of batch) {
        if (signal.aborted) throw new AbortError();

        const mediaPath = getMediaPathFromThumbPath(fullPath);
        if (!validPaths.has(mediaPath)) {
          ghostItems.push({ path: fullPath });
        }
      }

      send({
        type: "progress",
        current: Math.min(i + batchSize, total),
        total,
        found: ghostItems.length,
      });

      // しきい値を超える件数を検出したら終了
      if (ghostItems.length > MAX_GHOST_ITEMS) throw new AbortError();
    }
  } catch (e) {
    if (isAbortError(e)) {
      return ghostItems;
    }

    // AbortError 以外の場合はエスカレーション
    throw e;
  }

  return ghostItems;
}

// 高速スキャン (フォルダ単位)
async function runQuickScan(
  send: (data: GhostThumbScanEventData) => void,
  signal: AbortSignal
): Promise<GhostThumbItem[]> {
  const ghostItems: GhostThumbItem[] = [];

  // FS 上のサムネイルディレクトリ一覧を取得
  const thumbRoot = path.resolve(PATHS.server.media.thumb.root);
  const normalizedRoot = sanitize(thumbRoot);
  const thumbDirs = await glob("**/", {
    cwd: thumbRoot,
    absolute: true,
    ignore: ["", "/"],
  });

  if (thumbDirs.length === 0 || signal.aborted) return [];
  const total = thumbDirs.length;

  // DB 上の dirPath 一覧を取得
  const allMedia = await db.media.findMany({ select: { dirPath: true } });
  const validDirParts = new Set<string>();

  // ひとつでもファイルがDBに登録されていれば、そのファイルの先祖をすべて有効なディレクトリエントリとして登録
  for (const m of allMedia) {
    let currentPath = sanitize(m.dirPath);
    while (currentPath) {
      if (signal.aborted) return [];

      validDirParts.add(currentPath);
      const parent = path.dirname(currentPath);
      if (parent === "." || parent === "/" || parent === currentPath) break;
      currentPath = parent;
    }
  }

  try {
    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new AbortError();

      const fullDirPath = sanitize(thumbDirs[i]);

      // 【超重要】絶対条件：ルートディレクトリ自体は絶対に削除対象に入れない
      if (fullDirPath === normalizedRoot) continue;

      // 相対パスに変換
      let relativeDirPath = fullDirPath.slice(normalizedRoot.length);
      if (relativeDirPath.startsWith("/"))
        relativeDirPath = relativeDirPath.substring(1);

      // 空文字（root）はスキップ
      if (!relativeDirPath) continue;

      // 判定：DB上のどのファイルのパス（およびその親）にも含まれていなければ「丸ごと不要」
      if (!validDirParts.has(relativeDirPath)) {
        ghostItems.push({ path: fullDirPath, isDirectory: true });
      }

      send({
        type: "progress",
        current: i + 1,
        total,
        found: ghostItems.length,
      });

      // しきい値を超える件数を検出したら終了
      if (ghostItems.length > MAX_GHOST_ITEMS) throw new AbortError();
    }
  } catch (e) {
    if (isAbortError(e)) {
      return ghostItems;
    }

    // AbortError 以外の場合はエスカレーション
    throw e;
  }

  // スキャンが正常終了した場合はフォルダの重複を排除（親フォルダが含まれる場合は子フォルダを除外）して返す
  return prune(ghostItems);
}

function prune(items: GhostThumbItem[]) {
  // パスが短い順（かつ辞書順）にソートする
  // これにより、親ディレクトリが必ず子ディレクトリより前に来るようになる
  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));

  const pruned: GhostThumbItem[] = [];
  let lastSavedPath = "";

  // ソート結果を確認
  for (const item of sorted) {
    // 現在のパスが、最後に保存した「削除確定パス」で始まっているかチェック
    // 例: lastSavedPath = "/root/trash"
    //     item.path = "/root/trash/subdir" -> これはスキップ対象

    const isChildOfLastSaved =
      lastSavedPath !== "" && item.path.startsWith(lastSavedPath + "/");

    if (!isChildOfLastSaved) {
      pruned.push(item);
      lastSavedPath = item.path; // 新たな「親」として基準を更新
    }
  }

  return pruned;
}
