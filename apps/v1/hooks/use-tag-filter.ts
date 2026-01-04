"use client";

import { useState } from "react";

export function useTagFilter() {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

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
    toggleTag,
    resetTags,
    selectTags,
  };
}
