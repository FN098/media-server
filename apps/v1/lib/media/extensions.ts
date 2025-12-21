export const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
] as const;

export const videoExtensions = [
  ".mp4",
  ".mov",
  ".mkv",
  ".avi",
  ".webm",
] as const;

export const audioExtensions = [
  ".mp3",
  ".wav",
  ".flac",
  ".m4a",
  ".aac",
  ".ogg",
] as const;

// 拡張子をまとめて型として定義
export const mediaExtensions = {
  image: imageExtensions,
  video: videoExtensions,
  audio: audioExtensions,
} as const;

export type MediaType = keyof typeof mediaExtensions;

export type MediaExt =
  | (typeof imageExtensions)[number]
  | (typeof videoExtensions)[number]
  | (typeof audioExtensions)[number];
