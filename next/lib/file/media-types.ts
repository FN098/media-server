import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/lib/file/extensions";

export const mediaTypes = ["audio", "image", "video"] as const;

export type MediaType = (typeof mediaTypes)[number];

export function isMediaFile(type: string): type is MediaType {
  return mediaTypes.includes(type as MediaType);
}

export function hasMediaFile(files: { type: string }[]) {
  return files.some((file) => isMediaFile(file.type));
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
