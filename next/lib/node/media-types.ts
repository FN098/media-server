import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/lib/node/extensions";

export const mediaTypes = ["audio", "image", "video"] as const;

export type MediaType = (typeof mediaTypes)[number];

export function isMedia(type: string | null) {
  return type != null && mediaTypes.includes(type as MediaType);
}

export function hasMedia(items: { type: string }[]) {
  return items.some((item) => isMedia(item.type));
}

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
