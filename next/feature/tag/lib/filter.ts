import { NodeFilter } from "@/lib/node/types";

export type TagFilterMode = "AND" | "OR" | "NOT" | "EMPTY";

export type TagFilterValue = {
  tags: { id: string; name: string }[];
  mode: TagFilterMode;
};

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
