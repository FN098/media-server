// =====================
// MIMETYPE/ファイル拡張子
// =====================

import { MediaFsNodeType } from "@/app/lib/media/types";

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

export const MIME_MAP: Record<MediaExt, string> = {
  // images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",

  // videos
  ".mp4": "video/mp4",
  ".mov": "video/mp4",
  ".mkv": "video/mp4",
  ".avi": "video/mp4",
  ".webm": "video/webm",

  // audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

export function getMimetype(filePath: string): string {
  const lower = filePath.toLowerCase();
  const ext = "." + (lower.split(".").pop() ?? "");

  return MIME_MAP[ext as MediaExt] ?? "application/octet-stream";
}

export function detectMediaType(name: string): MediaFsNodeType {
  const lowerName = name.toLowerCase();

  if (imageExtensions.some((ext) => lowerName.endsWith(ext))) {
    return "image";
  }

  if (videoExtensions.some((ext) => lowerName.endsWith(ext))) {
    return "video";
  }

  if (audioExtensions.some((ext) => lowerName.endsWith(ext))) {
    return "audio";
  }

  return "file";
}
