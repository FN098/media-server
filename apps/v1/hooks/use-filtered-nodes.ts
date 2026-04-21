"use client";

import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { useMemo } from "react";

type DirectoryBehavior = "include" | "exclude" | "filter";

export function useFilteredNodes(
  nodes: MediaNode[],
  pipeline: MediaNodeFilter[],
  options?: {
    activated?: boolean; // デフォルト: true
    directoryBehavior?: DirectoryBehavior; // デフォルト: "include"
  }
) {
  const { activated = true, directoryBehavior = "include" } = options ?? {};

  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!activated) return nodes;

    // フィルタの適用
    return nodes.filter((node) => {
      if (node.isDirectory) {
        switch (directoryBehavior) {
          case "include":
            return true; // 常に通す
          case "exclude":
            return false; // 完全除外
          case "filter":
            break; // 下の通常フィルタへ
        }
      }

      return pipeline.every((filter) => filter(node));
    });
  }, [activated, nodes, pipeline, directoryBehavior]);

  const filteredCount = filtered.length;
  const totalCount = nodes.length;
  const isFiltered = filteredCount != totalCount;

  return {
    filtered,
    filteredCount,
    totalCount,
    isFiltered,
  };
}
