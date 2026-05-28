import { useMemo } from "react";

type DirectoryBehavior = "include" | "exclude";

export type SelectableNode = {
  path: string;
  isDirectory: boolean;
};

interface UseSelectedNodes<T> {
  nodes: T[];
  selectedPaths: Iterable<string>;
  activated?: boolean;
  directoryBehavior?: DirectoryBehavior;
}

export function useSelectedNodes<T extends SelectableNode>({
  nodes,
  selectedPaths,
  activated = true,
  directoryBehavior = "include",
}: UseSelectedNodes<T>) {
  // O(1) で path => node を検索するための Map
  const nodeMap = useMemo(() => {
    return new Map(nodes.map((node) => [node.path, node]));
  }, [nodes]);

  // 選択済みノードリスト
  const selectedNodes = useMemo(() => {
    if (!activated) return [];

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
      .filter((node): node is T => node !== null);
  }, [activated, directoryBehavior, nodeMap, selectedPaths]);

  const selectedCount = selectedNodes.length;
  const isSelected = selectedCount > 0;

  return {
    selectedNodes,
    selectedCount,
    isSelected,
  };
}
