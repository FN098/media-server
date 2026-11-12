import { db } from "@/lib/prisma";

export async function getParentFolderAction(parentFolderId: string) {
  return db.folder.findUnique({
    where: { id: parentFolderId },
    select: { id: true, name: true, parentFolderId: true },
  });
}
