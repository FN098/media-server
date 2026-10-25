import {
  DirectoryPassMode,
  FavoriteFilterValue,
  FileTypeFilterValue,
  QueryFilterValue,
  TagFilterValue,
} from "@/__lib/filter/types";
import { isMediaFile } from "@/__lib/node/media-types";
import { isMatchJapanese } from "@/__lib/utils/japanese";
import { Node } from "@/lib/node/types";

type NodeFilter = (node: Node) => boolean;

export function withDirectoryControl(
  filter: NodeFilter,
  mode: DirectoryPassMode = "always"
): NodeFilter {
  return (node) => {
    if (node.isDirectory) {
      if (mode === "always") return true;
      if (mode === "never") return false;
    }
    return filter(node);
  };
}

export function createSearchFilter(value: QueryFilterValue): NodeFilter {
  const trimmed = value.query?.trim();
  return (node) => !trimmed || isMatchJapanese(node.name, trimmed);
}

export function createTagFilter(value: TagFilterValue): NodeFilter {
  return (node) => {
    if (node.isDirectory) return false;

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

export function createFileTypeFilter(value: FileTypeFilterValue): NodeFilter {
  return (node) => {
    if (value.types.length === 0) return true;
    if (node.isDirectory) return false;
    return value.types.includes(node.type);
  };
}

export function createFavoriteFilter(value: FavoriteFilterValue): NodeFilter {
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

export function createMediaOnlyFilter(): NodeFilter {
  return (node) => {
    if (node.isDirectory) return false;
    return isMediaFile(node.type);
  };
}
