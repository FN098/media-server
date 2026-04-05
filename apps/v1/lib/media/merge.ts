import {
  DbFavoriteInfo,
  DbFolderMeta,
  DbMedia,
  DbVisitedInfo,
  MediaFsNode,
  MediaNode,
} from "@/lib/media/types";

export function mergeFsWithDb(
  fsMedia: MediaFsNode[],
  dbMedia: DbMedia[],
  dbVisited: DbVisitedInfo[],
  dbFavorites: DbFavoriteInfo[],
  dbFolderMetas: DbFolderMeta[]
): MediaNode[] {
  const dbMediaMap = new Map(dbMedia.map((e) => [e.path, e]));
  const dbVisitedMap = new Map(dbVisited.map((e) => [e.path, e]));
  const dbFavoriteMap = new Map(dbFavorites.map((e) => [e.path, e]));
  const dbFolderMetaMap = new Map(dbFolderMetas.map((e) => [e.path, e]));

  const result = fsMedia.map((fsNode) => {
    const dbMedia = dbMediaMap.get(fsNode.path);
    const dbVisited = dbVisitedMap.get(fsNode.path);
    const dbFavorite = dbFavoriteMap.get(fsNode.path);
    const dbFolderMeta = dbFolderMetaMap.get(fsNode.path);

    return {
      ...fsNode,
      id: dbMedia?.id,
      title: dbMedia?.title ?? fsNode.name,
      isFavorite: dbMedia?.isFavorite ?? false,
      lastViewedAt: dbVisited?.lastViewedAt ?? undefined,
      favoriteCount: dbFavorite?.favoriteCountInFolder,
      tags: dbMedia?.tags,
      // フォルダの場合のみ DB に保存されている previewPath を適用
      previewPath: fsNode.isDirectory ? dbFolderMeta?.previewPath : undefined,
    } satisfies MediaNode;
  });

  return result;
}
