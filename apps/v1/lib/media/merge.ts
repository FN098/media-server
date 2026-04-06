import {
  DbFavoriteInfo,
  DbFolderMeta,
  DbMedia,
  DbVisitedInfo,
  MediaFsNode,
  MediaNode,
} from "@/lib/media/types";

export function mergeFsWithDb({
  fsMedia,
  dbMedia = [],
  dbVisited = [],
  dbFavorites = [],
  dbFolderMetas = [],
}: {
  fsMedia: MediaFsNode[];
  dbMedia?: DbMedia[];
  dbVisited?: DbVisitedInfo[];
  dbFavorites?: DbFavoriteInfo[];
  dbFolderMetas?: DbFolderMeta[];
}): MediaNode[] {
  const dbMediaMap = new Map(dbMedia.map((e) => [e.path, e]));
  const dbVisitedMap = new Map(dbVisited.map((e) => [e.path, e]));
  const dbFavoriteMap = new Map(dbFavorites.map((e) => [e.path, e]));
  const dbFolderMetaMap = new Map(dbFolderMetas.map((e) => [e.path, e]));

  return fsMedia.map((fsNode) => {
    const dbMediaEntry = dbMediaMap.get(fsNode.path);
    const dbVisitedEntry = dbVisitedMap.get(fsNode.path);
    const dbFavoriteEntry = dbFavoriteMap.get(fsNode.path);
    const dbFolderMetaEntry = dbFolderMetaMap.get(fsNode.path);

    return {
      ...fsNode,
      id: dbMediaEntry?.id,
      title: dbMediaEntry?.title ?? fsNode.name,
      isFavorite: dbMediaEntry?.isFavorite ?? false,
      lastViewedAt: dbVisitedEntry?.lastViewedAt ?? undefined,
      favoriteCount: dbFavoriteEntry?.favoriteCountInFolder,
      tags: dbMediaEntry?.tags,
      previewPath: fsNode.isDirectory
        ? dbFolderMetaEntry?.previewPath
        : undefined,
      rating: dbMediaEntry?.rating,
    } satisfies MediaNode;
  });
}
