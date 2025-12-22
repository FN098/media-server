import { DbMedia, MediaFsListing, MediaListing } from "@/lib/media/types";

export function mergeFsWithDb(
  listing: MediaFsListing,
  dbMedia: DbMedia[]
): MediaListing {
  const dbMap = new Map(dbMedia.map((m) => [m.path, m]));

  const mediaNodes = listing.nodes.map((node) => {
    if (node.isDirectory) {
      return { ...node, isFavorite: false };
    }

    const db = dbMap.get(node.path);

    return {
      ...node,
      title: db?.title ?? node.name,
      isFavorite: db?.isFavorite ?? false,
    };
  });

  return {
    nodes: mediaNodes,
    parent: listing.parent,
    path: listing.path,
  };
}
