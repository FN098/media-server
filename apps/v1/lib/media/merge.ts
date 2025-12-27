import { DbFolder } from "@/lib/folder/types";
import { DbMedia, MediaFsNode, MediaNode } from "@/lib/media/types";

export function mergeFsWithDb(
  fsMedia: MediaFsNode[],
  dbMedia: DbMedia[],
  dbFolders: DbFolder[]
): MediaNode[] {
  const dbMediaMap = new Map(dbMedia.map((e) => [e.path, e]));
  const dbFolderMap = new Map(dbFolders.map((e) => [e.path, e]));

  const result = fsMedia.map((fsNode) => {
    const dbMedia = dbMediaMap.get(fsNode.path);
    const dbFolder = dbFolderMap.get(fsNode.path);

    return {
      ...fsNode,
      title: dbMedia?.title ?? fsNode.name,
      isFavorite: dbMedia?.isFavorite ?? false,
      lastViewedAt: dbFolder?.lastViewedAt,
    };
  });

  return result;
}
