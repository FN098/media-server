import fs from "fs/promises";
import path from "path";

export async function listSqlFiles(dirPath: string) {
  const fileNames = await fs.readdir(dirPath);

  return await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".sql"))
      .map(async (fileName) => {
        const filePath = path.join(dirPath, fileName);
        const stats = await fs.stat(filePath);
        return {
          name: fileName,
          mtime: stats.mtime,
          size: stats.size,
        };
      })
  );
}
