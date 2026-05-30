import { useMemo } from "react";

type DirectoryBehavior = "include" | "exclude";

type SelectableNode = {
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
  const selectedNodes = useMemo(
    () =>
      nodes.filter((node) => {
        if (node.isDirectory) {
          switch (directoryBehavior) {
            case "include":
              return selectedPaths.has(node.path);
            case "exclude":
              return false;
          }
        }
        return selectedPaths.has(node.path);
      }),
    [directoryBehavior, nodes, selectedPaths]
  );

  return activated ? selectedNodes : [];
}
