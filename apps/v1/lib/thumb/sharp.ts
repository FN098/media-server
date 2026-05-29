import sharp from "sharp";

sharp.cache(false);

type ThumbOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

export async function createImageThumb(
  imagePath: string,
  thumbPath: string,
  options?: ThumbOptions
): Promise<void> {
  const { width = 400, height = 400, quality = 80 } = options || {};

  const pipeline = sharp(imagePath)
    .resize(width, height, { fit: "inside" })
    .webp({ quality });

  try {
    await pipeline.toFile(thumbPath);
  } finally {
    // 成功・失敗に関わらず、明示的にリソースを解放する
    pipeline.destroy();
  }
}
