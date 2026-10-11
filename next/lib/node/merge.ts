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
      mtime: f.mtime,
      isLocked: f.isLocked,
      tags: f.tags,
      deletedAt: f.deletedAt,
      favoritedAt: f.favoritedAt,

      // parentFolderId: string | null;
      // previewFileId: string | null;
      // name: string;
      // isDirectory: true;
      // size: number | null;
      // mtime: Date | null;
      // isLocked: boolean;
      // fileCount: number | null;
      // favoriteFileCount: number | null;
      // averageFileRating: number | null;
      // deletedAt: Date | null;
    } satisfies FolderNode);
  }

  return nodes;
}
