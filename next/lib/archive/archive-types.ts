import { archiveExtensions } from "@/lib/archive/extensions";

export type ArchiveType = "archive";

export function isArchiveFile(type: string): type is ArchiveType {
  return type === "archive";
}

export function detectArchiveType(fileName: string): ArchiveType | null {
  const lowerName = fileName.toLowerCase();

  if (archiveExtensions.some((ext) => lowerName.endsWith(ext))) {
    return "archive";
  }

  return null;
}
