import { TagFilterMode } from "@/hooks/use-tag-filter";
import { MediaNodeFilter, MediaTypeFilterValue } from "@/lib/media/types";
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

export const createRatingFilter = (minRating: number): MediaNodeFilter => {
  return (node) => {
    if (node.isDirectory) return true; // フォルダは常にパス
    if (minRating === 0) return true; // すべて
    if (minRating === -1) return node.rating === 0; // 評価無し

    const rating = node.rating ?? 0;
    return rating >= minRating; // ★1~5 以上
  };
};

export const createMediaTypeFilter = (
  type: MediaTypeFilterValue
): MediaNodeFilter => {
  return (node) => {
    if (type === "all") return true;
    return node.type === type;
  };
};
