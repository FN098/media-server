"use client";

import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { useMemo } from "react";

export function useFilteredNodes({
  allNodes,
  filters,
  activated = true,
}: {
  allNodes: MediaNode[];
  filters: MediaNodeFilter[];
  activated?: boolean;
}) {
  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!activated) return allNodes;

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) return true; // フォルダは対象外

      return filters.filter((f) => !!f).every((filter) => filter(node));
    });
  }, [activated, allNodes, filters]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filtered.filter((n) => isMedia(n.type)),
    [filtered]
  );

  const filteredCount = filtered.length;
  const totalCount = allNodes.length;
  const isFiltered = filteredCount != totalCount;

  return {
    filtered,
    mediaOnly,
    filteredCount,
    totalCount,
    isFiltered,
  };
}
