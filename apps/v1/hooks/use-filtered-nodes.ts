"use client";

import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { useMemo } from "react";

export function useFilteredNodes(
  nodes: MediaNode[],
  filters: MediaNodeFilter[],
  options?: {
    activated?: boolean;
  }
) {
  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!options?.activated) return nodes;

    // フィルタの適用
    return nodes.filter((node) => {
      if (node.isDirectory) return true; // フォルダは対象外

      return filters.filter((f) => !!f).every((filter) => filter(node));
    });
  }, [nodes, filters, options?.activated]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filtered.filter((n) => isMedia(n.type)),
    [filtered]
  );

  const filteredCount = filtered.length;
  const totalCount = nodes.length;
  const isFiltered = filteredCount != totalCount;

  return {
    filtered,
    mediaOnly,
    filteredCount,
    totalCount,
    isFiltered,
  };
}
