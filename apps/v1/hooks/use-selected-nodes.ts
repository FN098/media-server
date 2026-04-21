"use client";

import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

type DirectoryBehavior = "include" | "exclude";

export function useSelectedNodes(
  nodes: MediaNode[],
  selectedPaths: Iterable<string>,
  options?: {
    activated?: boolean; // デフォルト: true
    directoryBehavior?: DirectoryBehavior; // デフォルト: "include"
  }
) {
  const { activated = true, directoryBehavior = "include" } = options ?? {};

  // O(1) で path => node を検索するための Map
  const nodeMap = useMemo(() => {
    return new Map(nodes.map((node) => [node.path, node]));
  }, [nodes]);

  // 選択済みノードリスト
  const selectedNodes = useMemo(() => {
    if (!activated) return nodes;

    return Array.from(selectedPaths)
      .map((path) => {
        const node = nodeMap.get(path);
        if (!node) return null; // ノードが存在しない場合は選択から外す

        if (node.isDirectory) {
          switch (directoryBehavior) {
            case "include":
              return node;
            case "exclude":
              return null;
          }
        }

        return node;
      })
      .filter((node): node is MediaNode => node !== null);
  }, [activated, directoryBehavior, nodeMap, nodes, selectedPaths]);

  const selectedCount = selectedNodes.length;
  const isSelected = selectedCount > 0;

  return {
    selectedNodes,
    selectedCount,
    isSelected,
  };
}
