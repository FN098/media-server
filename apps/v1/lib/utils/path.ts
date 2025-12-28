import path from "path";

export function splitDirPath(dirPath: string) {
  const parts = dirPath.split(/[/\\]/);

  const folderName = parts.pop() || dirPath;
  const parentPath = parts.length > 0 ? parts.join("/") : "/";

  return {
    folderName,
    parentPath,
  };
}

export function getParentDirPath(filePath: string): string {
  const dir = path.dirname(filePath);

  // path.dirname はルート付近で "." を返すことがあるため、
  // アプリケーションの仕様に合わせて調整（空文字にする等）
  return dir === "." ? "" : dir.replace(/\\/g, "/");
}
