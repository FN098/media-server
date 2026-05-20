import { extname } from "path";

export const archiveExtensions = [".zip", ".rar", ".7z"] as const;

export type ArchiveExtension = (typeof archiveExtensions)[number];

function createGuard<const T extends readonly string[]>(values: T) {
  const set = new Set(values);

  return (value: unknown): value is T[number] =>
    typeof value === "string" && set.has(value);
}

export const isArchiveExtension = createGuard(archiveExtensions);

export function isArchiveFile(filePath: string): boolean {
  return isArchiveExtension(extname(filePath));
}
