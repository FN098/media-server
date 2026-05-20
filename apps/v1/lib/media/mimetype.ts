import { MediaExtension } from "@/lib/media/extensions";
import { getExtension } from "@/lib/utils/filename";

export const MIME_MAP: Record<MediaExtension, string> = {
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
  const ext = getExtension(filePath, { withDot: true, case: "lower" });

  return MIME_MAP[ext as MediaExtension] ?? "application/octet-stream";
}
