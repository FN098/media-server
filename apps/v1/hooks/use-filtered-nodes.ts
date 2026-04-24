"use client";

import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { useMemo } from "react";

export function useFilteredNodes(
  nodes: MediaNode[],
  pipeline: MediaNodeFilter[],
  options?: {
    activated?: boolean; // デフォルト: true
  }
) {
  const { activated = true } = options ?? {};

  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!activated) return nodes;

    // フィルタの適用
    return nodes.filter((node) => pipeline.every((filter) => filter(node)));
  }, [activated, nodes, pipeline]);

  return {
    filtered,
    filteredCount: filtered.length,
    totalCount: nodes.length,
    isFiltered: filtered.length !== nodes.length,
  };
}
