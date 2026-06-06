import { APP_CONFIG } from "@/app.config";
import { AbortError, isAbortError } from "@/lib/errors/abort-error";
import {
  GhostThumbItem,
  GhostThumbScanEventData,
} from "@/lib/ghost-thumb/types";
import { logger } from "@/lib/logger";
import { getMediaPathFromThumbPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { glob } from "glob";
import { NextRequest } from "next/server";
import path from "path";

const MAX_GHOST_ITEMS = 10000;

// ゴーストサムネイル（DB 上にのみ存在し、FS 上に存在しないファイル）をスキャンする
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const isFullScan = searchParams.get("full") === "true";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: GhostThumbScanEventData) => {
        // クライアントが切断していたら enqueue しない
        if (!req.signal.aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }
      };

      try {
        let items: GhostThumbItem[];

        if (isFullScan) {
          items = await runFullScan(send, req.signal);
        } else {
          items = await runQuickScan(send, req.signal);
        }

        if (!req.signal.aborted) {
          send({ type: "complete", items });
        }
      } catch (error) {
        logger.error("api:ghost-thumb-scan", error);
        send({ type: "error", message: "Failed to scan ghost thumb" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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
  const allMedia = await prisma.media.findMany({ select: { path: true } });
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
  const normalizedRoot = normalizeDirPath(thumbRoot);
  const thumbDirs = await glob("**/", {
    cwd: thumbRoot,
    absolute: true,
    ignore: ["", "/"],
  });

  if (thumbDirs.length === 0 || signal.aborted) return [];
  const total = thumbDirs.length;

  // DB 上の dirPath 一覧を取得
  const allMedia = await prisma.media.findMany({ select: { dirPath: true } });
  const validDirParts = new Set<string>();

  // ひとつでもファイルがDBに登録されていれば、そのファイルの先祖をすべて有効なディレクトリエントリとして登録
  for (const m of allMedia) {
    let currentPath = normalizeDirPath(m.dirPath);
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

      const fullDirPath = normalizeDirPath(thumbDirs[i]);

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
  return filterGhostThumbItems(ghostItems);
}

function normalizeDirPath(path: string) {
  // 末尾の / を削除
  return path.replace(/\/$/, "");
}

function filterGhostThumbItems(items: GhostThumbItem[]) {
  // パスが短い順（かつ辞書順）にソートする
  // これにより、親ディレクトリが必ず子ディレクトリより前に来るようになる
  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));

  const filtered: GhostThumbItem[] = [];
  let lastSavedPath = "";

  // ソート結果を確認
  for (const item of sorted) {
    // 現在のパスが、最後に保存した「削除確定パス」で始まっているかチェック
    // 例: lastSavedPath = "/root/trash"
    //     item.path = "/root/trash/subdir" -> これはスキップ対象

    const isChildOfLastSaved =
      lastSavedPath !== "" && item.path.startsWith(lastSavedPath + "/");

    if (!isChildOfLastSaved) {
      filtered.push(item);
      lastSavedPath = item.path; // 新たな「親」として基準を更新
    }
  }

  return filtered;
}
