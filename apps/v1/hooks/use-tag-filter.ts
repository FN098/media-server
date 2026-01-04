"use client";

import { MediaNode } from "@/lib/media/types";
import { useMemo, useState } from "react";

export function useTagFilter(nodes: MediaNode[]) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // 全ノードからユニークなタグを抽出
  const allTags = useMemo(() => {
    const tagNames = nodes.flatMap((n) => n.tags?.map((t) => t.name) ?? []);
    return Array.from(new Set(tagNames)).sort((a, b) => a.localeCompare(b));
  }, [nodes]);

  // 選択されたタグでフィルタリング (AND条件)
  const filteredNodes = useMemo(() => {
    if (selectedTags.size === 0) return nodes;
    return nodes.filter((node) => {
      const nodeTagNames = node.tags?.map((t) => t.name) ?? [];
      return Array.from(selectedTags).every((tag) =>
        nodeTagNames.includes(tag)
      );
    });
  }, [nodes, selectedTags]);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setSelectedTags(next);
  };

  const resetTags = () => setSelectedTags(new Set());

  const selectTags = (tags: Iterable<string>) => setSelectedTags(new Set(tags));

  return {
    allTags,
    selectedTags,
    filteredNodes,
    toggleTag,
    resetTags,
    selectTags,
  };
}
