import { MediaNodeFilter } from "@/lib/media/types";
import { isMatchJapanese } from "@/lib/utils/search";

export const createLimitFilter = (limit: number): MediaNodeFilter => {
  let count = 0;
  return () => {
    count++;
    return count <= limit;
  };
};

export const createSearchFilter = (query: string): MediaNodeFilter => {
  const trimmed = query.trim();
  return (node) => !trimmed || isMatchJapanese(node.name, trimmed);
};

export const createTagFilter = (selectedTags: string[]): MediaNodeFilter => {
  return (node) => {
    if (selectedTags.length === 0) return true;
    if (!node.tags) return false;
    return selectedTags.every((tag) =>
      node.tags?.map((t) => t.name)?.includes(tag)
    );
  };
};

export const createFavoriteFilter = (isActive: boolean): MediaNodeFilter => {
  return (node) => !isActive || !!node.isFavorite;
};
