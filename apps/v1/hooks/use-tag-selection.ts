import { Tag } from "@/generated/prisma";
import { MediaNode } from "@/lib/media/types";
import { uniqueBy } from "@/lib/utils/unique";
import { useMemo } from "react";

export type TagState = "all" | "some" | "none";

export function useTagSelection(selectedNodes: MediaNode[], allTags: Tag[]) {
  return useMemo(() => {
    const totalSelected = selectedNodes.length;

    // 何も選択されていない場合はすべて none
    if (totalSelected === 0) {
      const emptyStates: Record<string, TagState> = {};
      allTags.forEach((tag) => (emptyStates[tag.name] = "none"));
      return { tagStates: emptyStates };
    }

    const tagCounts: Record<string, number> = {};

    // 選択ノードのタグを集計
    selectedNodes
      .filter((node) => !!node.tags)
      .forEach((node) => {
        const uniqueTags = uniqueBy(node.tags!, "name");
        uniqueTags.forEach((tag) => {
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
      });

    // タグごとの状態を決定
    // - all: すべての選択ノードにタグが含まれる
    // - some: 一部の選択ノードにタグが含まれる
    // - none: 選択ノードにタグが含まれていない
    const tagStates: Record<string, TagState> = {};
    allTags.forEach((tag) => {
      const count = tagCounts[tag.name] || 0;
      if (count === 0) tagStates[tag.name] = "none";
      else if (count === totalSelected) tagStates[tag.name] = "all";
      else tagStates[tag.name] = "some";
    });

    return { tagStates };
  }, [selectedNodes, allTags]);
}
