import { Tag } from "@/generated/prisma";
import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

export function useTagSelection(selectedNodes: MediaNode[], allTags: Tag[]) {
  return useMemo(() => {
    const totalSelected = selectedNodes.length;
    if (totalSelected === 0) return { tagStates: {} };

    const tagCounts: Record<string, number> = {};

    selectedNodes.forEach((node) => {
      node.tags?.forEach((tag) => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });

    const tagStates: Record<string, "all" | "some" | "none"> = {};
    allTags.forEach((tag) => {
      const count = tagCounts[tag.name] || 0;
      if (count === 0) tagStates[tag.name] = "none";
      else if (count === totalSelected) tagStates[tag.name] = "all";
      else tagStates[tag.name] = "some";
    });

    return { tagStates };
  }, [selectedNodes, allTags]);
}
