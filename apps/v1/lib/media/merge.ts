import {
  FolderFavoriteInfo,
  FolderMeta,
  FolderVisitedInfo,
  MediaDbNode,
  MediaFsNode,
  MediaNode,
} from "@/lib/media/types";

export function mergeFsWithDb({
  fsNodes,
  dbNodes = [],
  folderVisited: visited = [],
  folderFavorites: favorites = [],
  folderMetas = [],
}: {
  fsNodes: MediaFsNode[];
  dbNodes?: MediaDbNode[];
  folderVisited?: FolderVisitedInfo[];
  folderFavorites?: FolderFavoriteInfo[];
  folderMetas?: FolderMeta[];
}): MediaNode[] {
  const dbNodeMap = new Map(dbNodes.map((e) => [e.path, e]));
  const visitedMap = new Map(visited.map((e) => [e.path, e]));
  const favoriteMap = new Map(favorites.map((e) => [e.path, e]));
  const folderMetaMap = new Map(folderMetas.map((e) => [e.path, e]));

  return fsNodes.map((node) => {
    const dbNode = dbNodeMap.get(node.path);

    if (node.isDirectory) {
      const visited = visitedMap.get(node.path);
      const fav = favoriteMap.get(node.path);
      const meta = folderMetaMap.get(node.path);

      // フォルダ
      return {
        ...node,
        id: dbNode?.id,
        title: dbNode?.title ?? null,
        lastViewedAt: visited?.lastViewedAt ?? null,
        favoriteCount: fav?.favoriteMediaCount,
        tags: null,
        previewPath: meta?.previewPath,
        rating: 0,
      } satisfies MediaNode;
    } else {
      // ファイル
      return {
        ...node,
        id: dbNode?.id,
        title: dbNode?.title ?? null,
        lastViewedAt: null,
        favoriteCount: null,
        tags: dbNode?.tags ?? null,
        previewPath: dbNode?.previewPath,
        rating: dbNode?.rating ?? null,
      } satisfies MediaNode;
    }
  });
}
