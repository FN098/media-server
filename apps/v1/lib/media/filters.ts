import { TagFilterMode } from "@/hooks/use-tag-filter";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { isMatchJapanese } from "@/lib/utils/search";
import { MediaTypeFilterValue, RatingFilterInput } from "../filter/types";

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

export function createRatingFilter(filter: RatingFilterInput) {
  return (node: MediaNode) => {
    const rating = node.rating;

    switch (filter.mode) {
      case "all":
        return true;

      case "unrated":
        return rating == null;

      case "rated": {
        if (rating == null) return false;

        const c = filter.condition;

        switch (c.operator) {
          case "gte":
            return rating >= c.value;
          case "lte":
            return rating <= c.value;
          case "eq":
            return rating === c.value;
          case "between":
            return rating >= c.min && rating <= c.max;
        }
      }
    }
  };
}

export const createMediaTypeFilter = (
  type: MediaTypeFilterValue
): MediaNodeFilter => {
  return (node) => {
    if (type === "all") return true;
    return node.type === type;
  };
};
