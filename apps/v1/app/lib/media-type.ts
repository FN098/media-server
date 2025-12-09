import { MediaFsNodeType } from "@/app/types/media-fs";

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const videoExtensions = [".mp4", ".mov", ".mkv"];
const audioExtensions = [".mp3", ".wav", ".ogg"];

export function detectMediaFsNodeType(name: string): MediaFsNodeType {
  const ext = name.toLowerCase();

  if (
    ext.endsWith(".jpg") ||
    ext.endsWith(".jpeg") ||
    ext.endsWith(".png") ||
    ext.endsWith(".webp")
  ) {
    return "image";
  }
  if (ext.endsWith(".mp4") || ext.endsWith(".mov") || ext.endsWith(".mkv")) {
    return "video";
  }
  if (ext.endsWith(".mp3") || ext.endsWith(".wav")) {
    return "audio";
  }
  return "file";
}
