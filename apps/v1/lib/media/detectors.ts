import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/lib/media/extensions";
import { MediaType } from "@/lib/media/types";

export const mediaTypes = ["audio", "image", "video"] as const;

export const isMedia = (type: string | null) =>
  type != null && mediaTypes.includes(type as MediaType);

export const hasMedia = (items: { type: string }[]) =>
  items.some((item) => isMedia(item.type));

export function detectMediaType(fileName: string): MediaType | null {
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

  return null;
}
