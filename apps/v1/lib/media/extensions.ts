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
  ".opus",
] as const;

export const mediaExtensions = [
  ...imageExtensions,
  ...videoExtensions,
  ...audioExtensions,
] as const;

export type ImageExtension = (typeof imageExtensions)[number];
export type VideoExtension = (typeof videoExtensions)[number];
export type AudioExtension = (typeof audioExtensions)[number];
export type MediaExtension = ImageExtension | VideoExtension | AudioExtension;

function createGuard<const T extends readonly string[]>(values: T) {
  const set = new Set(values);

  return (value: unknown): value is T[number] =>
    typeof value === "string" && set.has(value);
}

export const isImageExtension = createGuard(imageExtensions);
export const isVideoExtension = createGuard(videoExtensions);
export const isAudioExtension = createGuard(audioExtensions);
export const isMediaExtension = createGuard(mediaExtensions);
