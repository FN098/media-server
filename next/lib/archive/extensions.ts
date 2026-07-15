export const archiveExtensions = [".zip", ".rar", ".7z"] as const;

export type ArchiveExtension = (typeof archiveExtensions)[number];
