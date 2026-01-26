import { MediaExt } from "@/lib/media/extensions";

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
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",

  // audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
};

export function getMimetype(filePath: string): string {
  const lower = filePath.toLowerCase();
  const ext = "." + (lower.split(".").pop() ?? "");

  return MIME_MAP[ext as MediaExt] ?? "application/octet-stream";
}
