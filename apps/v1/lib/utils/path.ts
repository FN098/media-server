import { createHash } from "crypto";

export function splitDirPath(dirPath: string) {
  const parts = dirPath.split(/[/\\]/);

  const folderName = parts.pop() || dirPath;
  const parentPath = parts.length > 0 ? parts.join("/") : "/";

  return {
    folderName,
    parentPath,
  };
}

export function hashPath(path: string) {
  return createHash("sha1").update(path).digest("hex").slice(0, 12);
}
