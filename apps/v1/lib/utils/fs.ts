import fs from "fs/promises";

export async function existsDir(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}
export async function existsFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
