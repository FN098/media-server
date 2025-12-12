// =====================
// サムネイル
// =====================

import { getMediaPath, getMediaThumbPath } from "@/app/lib/media/path-helpers";
import { MediaFsNode } from "@/app/lib/media/types";
import { spawn } from "child_process";
import fs, { mkdir } from "fs/promises";
import { dirname } from "path";

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
  return new Promise<void>((resolve, reject) => {
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
      thumbPath,
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

    ff.stderr.on("data", (data) => console.error(data.toString()));
  });
}

export async function createVideoThumbs(nodes: MediaFsNode[]): Promise<void> {
  // ビデオファイルを取得
  const videos = nodes.filter((n) => n.type === "video");
  if (videos.length === 0) return;

  // 必要なディレクトリを一括で作成
  const thumbDirs = Array.from(
    new Set(videos.map((v) => dirname(getMediaThumbPath(v.path))))
  );
  await Promise.all(thumbDirs.map((dir) => mkdir(dir, { recursive: true })));

  // サムネイル生成
  await Promise.all(
    videos.map(async (v) => {
      const thumb = getMediaThumbPath(v.path);

      // サムネイルがまだ存在しない場合のみ生成
      if (!(await existsThumb(thumb))) {
        const video = getMediaPath(v.path);
        await createVideoThumb(video, thumb);
      }
    })
  );
}
