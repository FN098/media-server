// =====================
// サムネイル
// =====================

import { APP_CONFIG } from "@/app.config";
import { getMediaPath, getMediaThumbPath } from "@/app/lib/media/path-helpers";
import { MediaFsNode } from "@/app/lib/media/types";
import { spawn } from "child_process";
import fs, { mkdir } from "fs/promises";
import { dirname } from "path";
import sharp from "sharp";

export async function existsThumb(thumbPath: string): Promise<boolean> {
  try {
    await fs.access(thumbPath);
    return true;
  } catch {
    return false;
  }
}

export async function createVideoThumb(
  videoPath: string,
  thumbPath: string
): Promise<void> {
  // 一旦 ffmpeg でサムネ生成（元サイズ）
  const tempThumb = thumbPath + ".tmp.jpg";
  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-v",
      "quiet",
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-q:v",
      "80",
      tempThumb,
    ]);

    ff.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `Error creating '${thumbPath}'. ffmpeg exited with code ${code}`
          )
        );
    });
  });

  // sharp でリサイズして最終出力
  await sharp(tempThumb)
    .resize({ width: APP_CONFIG.thumb.width }) // 高さは自動
    .toFile(thumbPath);

  // 一時ファイル削除
  await fs.unlink(tempThumb);
}

export async function createImageThumb(
  imagePath: string,
  thumbPath: string
): Promise<void> {
  await sharp(imagePath)
    .resize({ width: APP_CONFIG.thumb.width }) // 高さは自動
    .toFile(thumbPath);
}

export async function createThumbs(nodes: MediaFsNode[]): Promise<void> {
  if (nodes.length === 0) return;

  // ビデオファイルを取得
  const filtered = nodes.filter(
    (n) => n.type === "video" || n.type === "image"
  );
  if (filtered.length === 0) return;

  // サムネイルのディレクトリを一括作成
  const thumbDirs = Array.from(
    new Set(filtered.map((n) => dirname(getMediaThumbPath(n.path))))
  );
  await Promise.all(thumbDirs.map((dir) => mkdir(dir, { recursive: true })));

  // サムネイルがまだ存在しない場合のみ生成
  await Promise.all(
    filtered.map(async (n) => {
      const thumb = getMediaThumbPath(n.path);
      if (await existsThumb(thumb)) return;

      const media = getMediaPath(n.path);
      if (n.type === "video") {
        await createVideoThumb(media, thumb);
      } else if (n.type === "image") {
        await createImageThumb(media, thumb);
      }
    })
  );
}
