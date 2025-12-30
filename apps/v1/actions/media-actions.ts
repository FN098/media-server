"use server";

import { getMediaFsNodes } from "@/lib/media/fs";
import { syncMediaDir } from "@/lib/media/sync";

export async function syncMediaDirAction(dirPath: string) {
  const nodes = await getMediaFsNodes(dirPath);
  await syncMediaDir(dirPath, nodes);
  console.log("sync completed");
}
