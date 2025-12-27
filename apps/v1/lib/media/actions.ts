"use server";

import { getMediaFsNodes } from "@/lib/media/listing";
import { syncMediaDir } from "@/lib/media/sync";

export async function syncMediaDirActions(dirPath: string) {
  const nodes = await getMediaFsNodes(dirPath);
  await syncMediaDir(dirPath, nodes);
}
