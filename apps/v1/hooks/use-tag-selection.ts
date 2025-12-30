import { Tag } from "@/generated/prisma";
import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

export type TagState = "all" | "none";

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

    selectedNodes.forEach((node) => {
      // 重複カウントを防ぐため、1つのノード内でタグはユニークである前提
      node.tags?.forEach((tag) => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });

    const tagStates: Record<string, TagState> = {};
    allTags.forEach((tag) => {
      const count = tagCounts[tag.name] || 0;
      // 方針：選択した「すべて」のファイルに設定されている場合のみ "all" (ON)
      // それ以外（一部、またはゼロ）は "none" (OFF)
      tagStates[tag.name] = count === totalSelected ? "all" : "none";
    });

    return { tagStates };
  }, [selectedNodes, allTags]);
}
