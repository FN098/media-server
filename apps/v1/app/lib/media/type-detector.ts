import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/app/lib/media/extensions";
import { MediaFsNodeType } from "@/app/lib/media/types";

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
