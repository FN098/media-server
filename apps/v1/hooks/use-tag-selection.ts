"use client";

import { MediaNode } from "@/lib/media/types";
import { Tag, TagCounts, TagStates } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { useMemo } from "react";

export function useTagStates(
  selectedNodes: MediaNode[],
  allTags: Tag[]
): TagStates {
  return useMemo(() => {
    const totalSelected = selectedNodes.length;

    // 何も選択されていない場合はすべて none
    if (totalSelected === 0) {
      const emptyStates: TagStates = {};
      allTags.forEach((tag) => (emptyStates[tag.name] = "none"));
      return emptyStates;
    }

    const tagCounts: TagCounts = {};

    // 選択ノードのタグを集計
    selectedNodes
      .filter((node) => !!node.tags)
      .forEach((node) => {
        const uniqueTags = uniqueBy(node.tags!, "name");
        uniqueTags.forEach((tag) => {
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
      });

    const tagStates: TagStates = {};

    // タグごとの状態を決定
    // - all: すべての選択ノードにタグが含まれる
    // - some: 一部の選択ノードにタグが含まれる
    // - none: 選択ノードにタグが含まれていない
    allTags.forEach((tag) => {
      const count = tagCounts[tag.name] || 0;
      if (count === 0) tagStates[tag.name] = "none";
      else if (count === totalSelected) tagStates[tag.name] = "all";
      else tagStates[tag.name] = "some";
    });

    return tagStates;
  }, [allTags, selectedNodes]);
}
