import { createVideoThumb } from "@/lib/child_process/ffmpeg";
import { MediaFsNode } from "@/lib/media/types";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/lib/path/helpers";
import { createImageThumb } from "@/lib/thumb/sharp";
import { existsPath } from "@/lib/utils/fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";

export async function createThumbs(
  nodes: MediaFsNode[],
  options?: {
    force?: boolean;
    seekSeconds?: number;
  }
): Promise<void> {
  if (nodes.length === 0) return;

  // ビデオまたは画像ファイルを取得
  const videoOrImage = nodes.filter(
    (n) => n.type === "video" || n.type === "image"
  );

  if (videoOrImage.length === 0) return;

  // サムネイル出力先ディレクトリを計算
  const thumbDirs = Array.from(
    new Set(videoOrImage.map((n) => dirname(getServerMediaThumbPath(n.path))))
  );

  // サムネイルの出力先ディレクトリを一括作成
  await Promise.all(thumbDirs.map((dir) => mkdir(dir, { recursive: true })));

  // ビデオまたは画像ファイルのサムネイルをディレクトリ単位で一括作成
  await Promise.all(
    videoOrImage.map(async (n) => {
      const thumb = getServerMediaThumbPath(n.path);

      // サムネイルが既に存在し、強制上書きが許可されていなければスキップ
      if ((await existsPath(thumb)) && !options?.force) return;

      const media = getServerMediaPath(n.path);

      try {
        if (n.type === "video") {
          await createVideoThumb(media, thumb, options?.seekSeconds);
        } else if (n.type === "image") {
          await createImageThumb(media, thumb);
        }
      } catch (err) {
        console.error(`Thumbnail creation failed for ${media}:`, err);
        // 個別の失敗で全体を止めないよう、ここではエラーを握り潰すかログに留める
      }
    })
  );
}
