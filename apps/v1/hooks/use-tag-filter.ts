"use client";

import { useState } from "react";

export type TagFilterMode = "AND" | "OR" | "NOT";

export function useTagFilter() {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<TagFilterMode>("AND");

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
    selectedTags,
    mode,
    setMode,
    toggleTag,
    resetTags,
    selectTags,
  };
}
