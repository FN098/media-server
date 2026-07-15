export function splitDirPath(dirPath: string) {
  const parts = dirPath.split(/[/\\]/);

  const folderName = parts.pop() || dirPath;
  const parentPath = parts.length > 0 ? parts.join("/") : "/";

  return {
    folderName,
    parentPath,
  };
}
