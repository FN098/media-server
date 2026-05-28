import { useMemo } from "react";

type DirectoryBehavior = "include" | "exclude";

export type SelectableNode = {
  path: string;
  isDirectory: boolean;
};

interface UseSelectedNodes<T> {
  nodes: T[];
  selectedPaths: Set<string>;
  activated?: boolean;
  directoryBehavior?: DirectoryBehavior;
}

export function useSelectedNodes<T extends SelectableNode>({
  nodes,
  selectedPaths,
  activated = true,
  directoryBehavior = "include",
}: UseSelectedNodes<T>) {
  // 選択済みノードリスト
  const selectedNodes = useMemo(() => {
    if (!activated) return [];

    return nodes.filter((node) => {
      if (node.isDirectory) {
        switch (directoryBehavior) {
          case "include":
            return true;
          case "exclude":
            return false;
        }
      }
      return selectedPaths.has(node.path);
    });
  }, [activated, directoryBehavior, nodes, selectedPaths]);

  const selectedCount = selectedNodes.length;
  const isSelected = selectedCount > 0;

  return {
    selectedNodes,
    selectedCount,
    isSelected,
  };
}
