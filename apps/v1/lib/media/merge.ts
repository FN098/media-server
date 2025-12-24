import { DbMedia, MediaFsNode, MediaNode } from "@/lib/media/types";

export function mergeFsWithDb(
  fsMedia: MediaFsNode[],
  dbMedia: DbMedia[]
): MediaNode[] {
  const dbMap = new Map(dbMedia.map((m) => [m.path, m]));

  const result = fsMedia.map((fsNode) => {
    if (fsNode.isDirectory) {
      return { ...fsNode, isFavorite: false };
    }

    const dbNode = dbMap.get(fsNode.path);

    return {
      ...fsNode,
      title: dbNode?.title ?? fsNode.name,
      isFavorite: dbNode?.isFavorite ?? false,
    };
  });

  return result;
}
