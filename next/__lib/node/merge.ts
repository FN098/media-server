import { DbFiles } from "@/lib/file/repository";
import { DbFolders } from "@/lib/folder/repository";
import { FileNode, FolderNode, Node } from "@/lib/node/types";

export function mergeDbNodes(dbFiles: DbFiles, dbFolders: DbFolders): Node[] {
  const nodes: Node[] = [];

  for (const f of dbFiles) {
    nodes.push({
      id: f.id,
      parentFolderId: f.parentFolderId,
      previewFileId: f.previewFileId,
      name: f.name,
      isDirectory: false,
      type: f.type,
      size: f.size,
      mtime: f.mtime,
      isLocked: f.isLocked,
      tags: f.tags,
      deletedAt: f.deletedAt,
      favoritedAt: f.favoritedAt,
    } satisfies FileNode);
  }

  for (const f of dbFolders) {
    nodes.push({
      id: f.id,
      parentFolderId: f.parentFolderId,
      previewFileId: f.previewFileId,
      name: f.name,
      isDirectory: true,
      size: f.totalSize,
      isLocked: f.isLocked,
      deletedAt: f.deletedAt,
      mtime: null,
      favoritedAt: f.favoritedAt,
      fileCount: f.fileCount,
    } satisfies FolderNode);
  }

  return nodes;
}
