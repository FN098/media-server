import { FavoriteFilterMode } from "@/components/ui/buttons/favorite-filter-button";
import { TagFilterMode } from "@/hooks/use-tag-filter";
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

export const createTagFilter = (
  selectedTags: string[],
  mode: TagFilterMode = "AND"
): MediaNodeFilter => {
  return (node) => {
    const nodeTagNames = node.tags?.map((t) => t.name) || [];

    switch (mode) {
      case "OR":
        // 選択したタグのいずれか1つでも含まれていればOK
        return selectedTags.some((tag) => nodeTagNames.includes(tag));
      case "NOT":
        // 選択したタグがいずれも含まれていない場合のみOK
        return !selectedTags.some((tag) => nodeTagNames.includes(tag));
      case "AND":
        // すべて含まれている場合のみOK
        return selectedTags.every((tag) => nodeTagNames.includes(tag));
      case "EMPTY":
        // 1つもタグを含まなければOK
        return nodeTagNames.length === 0;
      default:
        return true;
    }
  };
};

export const createFavoriteFilter = (
  mode: FavoriteFilterMode
): MediaNodeFilter => {
  return (node) => {
    switch (mode) {
      case "only_favorites":
        return node.isFavorite;
      case "exclude_favorites":
        return !node.isFavorite;
      case "all":
      default:
        return true;
    }
  };
};
