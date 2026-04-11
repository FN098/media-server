import {
  FolderFavoriteInfo,
  FolderMeta,
  FolderVisitedInfo,
  MediaFsNode,
  MediaNode,
  VirtualMediaNode,
} from "@/lib/media/types";

export function mergeFsWithDb({
  realNodes,
  virtualNodes = [],
  folderVisited: visited = [],
  folderFavorites: favorites = [],
  folderMetas = [],
}: {
  realNodes: MediaFsNode[];
  virtualNodes?: VirtualMediaNode[];
  folderVisited?: FolderVisitedInfo[];
  folderFavorites?: FolderFavoriteInfo[];
  folderMetas?: FolderMeta[];
}): MediaNode[] {
  const virtualMediaMap = new Map(virtualNodes.map((e) => [e.path, e]));
  const visitedMap = new Map(visited.map((e) => [e.path, e]));
  const favoriteMap = new Map(favorites.map((e) => [e.path, e]));
  const folderMetaMap = new Map(folderMetas.map((e) => [e.path, e]));

  return realNodes.map((node) => {
    const media = virtualMediaMap.get(node.path);

    if (node.isDirectory) {
      const visited = visitedMap.get(node.path);
      const fav = favoriteMap.get(node.path);
      const meta = folderMetaMap.get(node.path);

      // フォルダ
      return {
        ...node,
        id: media?.id,
        title: meta?.title ?? node.name,
        lastViewedAt: visited?.lastViewedAt ?? undefined,
        favoriteCount: fav?.favoriteMediaCount,
        tags: undefined,
        previewPath: meta?.previewPath,
        rating: 0,
      } satisfies MediaNode;
    } else {
      // ファイル
      return {
        ...node,
        id: media?.id,
        title: media?.title ?? node.name,
        lastViewedAt: undefined,
        favoriteCount: undefined,
        tags: media?.tags,
        previewPath: media?.previewPath,
        rating: media?.rating ?? 0,
      } satisfies MediaNode;
    }
  });
}
