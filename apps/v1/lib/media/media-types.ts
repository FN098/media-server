import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/lib/media/extensions";
import { MediaFsNodeType } from "@/lib/media/types";

export const mediaTypes = [
  "audio",
  "image",
  "video",
] as const satisfies MediaFsNodeType[];

export type MediaType = (typeof mediaTypes)[number];

export const isMedia = (type: MediaFsNodeType) =>
  mediaTypes.includes(type as MediaType);

export function detectMediaType(fileName: string): MediaFsNodeType {
  const lowerName = fileName.toLowerCase();

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
