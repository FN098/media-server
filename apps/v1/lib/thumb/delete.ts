import { getServerMediaThumbPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { rm } from "fs/promises";

export async function deleteThumb(mediaPath: string): Promise<void> {
  const thumbPath = getServerMediaThumbPath(mediaPath);
  if (await existsPath(thumbPath)) {
    await rm(thumbPath, { force: true });
  }
}

export async function deleteThumbsInDirectory(
  mediaDirPath: string,
): Promise<void> {
  const thumbDirPath = getServerMediaThumbPath(mediaDirPath);
  if (await existsPath(thumbDirPath)) {
    await rm(thumbDirPath, { recursive: true, force: true });
  }
}
