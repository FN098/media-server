import { APP_CONFIG } from "@/app.config";
import { getMediaPathFromThumbPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { GhostThumbItem, GhostThumbScanEventData } from "@/lib/thumb/types";
import { glob } from "glob";
import { NextRequest } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

// フルスキャン (ファイル単位)
async function runFullScan(
  send: (data: GhostThumbScanEventData) => void,
  signal: AbortSignal
): Promise<GhostThumbItem[]> {
  const thumbRoot = PATHS.server.media.thumb.root;
  const ghostItems: GhostThumbItem[] = [];

  // 1. 全サムネイルファイルを取得
  const allThumbFiles = await glob("**/*" + APP_CONFIG.thumb.extension, {
    cwd: thumbRoot,
    absolute: true,
    nodir: true,
  });

  const total = allThumbFiles.length;
  if (total === 0) return [];

  // 2. DBの全パスをSetで取得（一回で取得して比較を高速化）
  const allMedia = await prisma.media.findMany({ select: { path: true } });
  const validPaths = new Set(allMedia.map((m) => m.path));

  // 3. 照合プロセス（進捗送信用にバッチ処理）
  const batchSize = 50;
  for (let i = 0; i < total; i += batchSize) {
    if (signal.aborted) return ghostItems;

    const batch = allThumbFiles.slice(i, i + batchSize);
    for (const fullPath of batch) {
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
  }

  return ghostItems;
}

// 高速スキャン (フォルダ単位)
async function runQuickScan(
  send: (data: GhostThumbScanEventData) => void,
  signal: AbortSignal
): Promise<GhostThumbItem[]> {
  const thumbRoot = PATHS.server.media.thumb.root;
  const ghostItems: GhostThumbItem[] = [];

  // サムネイル側のディレクトリ一覧を取得
  const thumbDirs = await glob("**/", { cwd: thumbRoot, absolute: true });
  const total = thumbDirs.length;

  // DB側のdirPath一覧を取得
  const folders = await prisma.media.groupBy({ by: ["dirPath"] });
  const validDirPaths = new Set(folders.map((f) => f.dirPath));

  for (let i = 0; i < total; i++) {
    if (signal.aborted) return ghostItems;

    const fullDirPath = thumbDirs[i];
    if (fullDirPath === thumbRoot || fullDirPath === thumbRoot + path.sep)
      continue;

    let relativeDirPath = fullDirPath
      .replace(thumbRoot, "")
      .replace(/\\/g, "/")
      .replace(/\/$/, "");
    if (relativeDirPath.startsWith("/"))
      relativeDirPath = relativeDirPath.substring(1);

    // そのフォルダがDBに存在しなければ、中身をまるごとゴーストとして追加
    if (!validDirPaths.has(relativeDirPath)) {
      const filesInDir = await glob("**/*" + APP_CONFIG.thumb.extension, {
        cwd: fullDirPath,
        absolute: true,
        nodir: true,
      });
      ghostItems.push(...filesInDir.map((path) => ({ path })));
    }

    send({
      type: "progress",
      current: i + 1,
      total,
      found: ghostItems.length,
    });
  }

  return ghostItems;
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isFullScan = searchParams.get("full") === "true";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: GhostThumbScanEventData) => {
        if (!req.signal.aborted) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }
      };

      try {
        let items: GhostThumbItem[] = [];
        if (isFullScan) {
          items = await runFullScan(send, req.signal);
        } else {
          items = await runQuickScan(send, req.signal);
        }

        if (!req.signal.aborted) {
          send({ type: "complete", items });
        }
      } catch (error) {
        console.error("Ghost Thumb Scan Error:", error);
        send({ type: "error", message: "スキャン中にエラーが発生しました" });
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
