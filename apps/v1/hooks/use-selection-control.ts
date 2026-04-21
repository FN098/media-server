"use client";

import { MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useMemo } from "react";

export function useSelectionControl({
  allNodes,
  controlledNodes,
}: {
  allNodes: MediaNode[];
  controlledNodes: MediaNode[];
}) {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // O(1) で path => node を検索するための Map
  const pathToNodeMap: Map<string, MediaNode> = useMemo(() => {
    return new Map(allNodes.map((node) => [node.path, node]));
  }, [allNodes]);

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = pathToNodeMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [pathToNodeMap, selectedPaths]);

  // 選択
  const select = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  // 全選択
  const selectAll = () => {
    selectPaths(controlledNodes.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const resetSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  return {
    isSelectionMode,
    selected,
    selectedPaths,
    select,
    selectAll,
    resetSelection,
  };
}
