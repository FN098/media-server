import {
  DirectoryPassMode,
  FavoriteFilterValue,
  MediaTypeFilterValue,
  QueryFilterValue,
  RatingFilterValue,
  TagFilterValue,
} from "@/lib/filter/types";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { isMatchJapanese } from "@/lib/utils/japanese";

export function withDirectoryControl(
  filter: MediaNodeFilter,
  mode: DirectoryPassMode = "always"
): MediaNodeFilter {
  return (node) => {
    if (node.isDirectory) {
      if (mode === "always") return true;
      if (mode === "never") return false;
    }
    return filter(node);
  };
}

export function createSearchFilter(value: QueryFilterValue): MediaNodeFilter {
  const trimmed = value.query?.trim();
  return (node) => !trimmed || isMatchJapanese(node.name, trimmed);
}

export function createTagFilter(value: TagFilterValue): MediaNodeFilter {
  return (node) => {
    const nodeTagNames = node.tags?.map((t) => t.name) || [];

    switch (value.mode) {
      case "OR":
        // 選択したタグのいずれか1つでも含まれていればOK
        return value.tags.some((tag) => nodeTagNames.includes(tag.name));
      case "NOT":
        // 選択したタグがいずれも含まれていない場合のみOK
        return !value.tags.some((tag) => nodeTagNames.includes(tag.name));
      case "AND":
        // すべて含まれている場合のみOK
        return value.tags.every((tag) => nodeTagNames.includes(tag.name));
      case "EMPTY":
        // 1つもタグを含まなければOK
        return nodeTagNames.length === 0;
      default:
        return true;
    }
  };
}

export function createRatingFilter(value: RatingFilterValue): MediaNodeFilter {
  return (node: MediaNode) => {
    const rating = node.isDirectory ? node.averageRating : node.rating;

    switch (value.mode) {
      case "all":
        return true;

      case "unrated":
        return rating == null;

      case "rated": {
        if (rating == null) return false;

        const c = value.condition;

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

export function createMediaTypeFilter(
  value: MediaTypeFilterValue
): MediaNodeFilter {
  return (node) => {
    if (value.types.length === 0) return true;
    return value.types.includes(node.type);
  };
}

export function createFavoriteFilter(
  value: FavoriteFilterValue
): MediaNodeFilter {
  return (node) => {
    switch (value.mode) {
      case "only_favorites":
        return !!node.favoritedAt;

      case "exclude_favorites":
        return !node.favoritedAt;

      case "all":

      default:
        return true;
    }
  };
}

export function createMediaOnlyFilter(): MediaNodeFilter {
  return (node) => {
    return isMedia(node.type);
  };
}
