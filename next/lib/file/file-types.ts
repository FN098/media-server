export const fileTypes = [
  "text",
  "binary",
  "image",
  "video",
  "audio",
  "archive",
] as const;

export type FileType = (typeof fileTypes)[number];

export function isFileType(type: string): type is FileType {
  return fileTypes.includes(type as FileType);
}
