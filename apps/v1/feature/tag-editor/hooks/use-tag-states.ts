import { MediaNode } from "@/lib/media/types";
import { Tag, TagState } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/array";
import { useMemo } from "react";

type TagStates = Record<string, TagState>;
type TagCounts = Record<string, number>;

export function useTagStates(
  selectedNodes: MediaNode[],
  allTags: Tag[]
): TagStates {
  const tagCounts = useMemo(() => {
    const result: TagCounts = {};

    // 選択ノードのタグを集計
    selectedNodes
      .filter((node) => !!node.tags)
      .forEach((node) => {
        const uniqueTags = uniqueBy(node.tags!, "name");
        uniqueTags.forEach((tag) => {
          result[tag.name] = (result[tag.name] || 0) + 1;
        });
      });

    return result;
  }, [selectedNodes]);

  const tagStates = useMemo(() => {
    const result: TagStates = {};

    if (selectedNodes.length === 0) {
      // 何も選択されていない場合はすべて none
      allTags.forEach((tag) => (result[tag.name] = "none"));
    } else {
      // タグごとの状態を決定
      // - all: すべての選択ノードにタグが含まれる
      // - some: 一部の選択ノードにタグが含まれる
      // - none: 選択ノードにタグが含まれていない
      allTags.forEach((tag) => {
        const count = tagCounts[tag.name] || 0;
        if (count === 0) result[tag.name] = "none";
        else if (count === selectedNodes.length) result[tag.name] = "all";
        else result[tag.name] = "some";
      });
    }

    return result;
  }, [allTags, selectedNodes.length, tagCounts]);

  return tagStates;
}
