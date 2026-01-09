import { getMediaPath, getMediaThumbPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import sharp from "sharp";
import { MediaFsNode } from "../media/types";

export async function createImageThumb(
  imagePath: string,
  thumbPath: string
): Promise<void> {
  await sharp(imagePath)
    .resize(400, 400, { fit: "inside" })
    .webp({ quality: 80 })
    .toFile(thumbPath);
}

export async function createVideoThumb(
  videoPath: string,
  thumbPath: string
): Promise<void> {
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
  });
}

export async function createThumbsIfNotExists(
  nodes: MediaFsNode[]
): Promise<void> {
  if (nodes.length === 0) return;

  // ビデオまたは画像ファイルを取得
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
      if (await existsPath(thumb)) return;

      const media = getMediaPath(n.path);

      if (n.type === "video") {
        await createVideoThumb(media, thumb);
      } else if (n.type === "image") {
        await createImageThumb(media, thumb); // 画像処理を追加
      }
    })
  );
}
