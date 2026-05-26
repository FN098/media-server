import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";

interface UseExplorerSelectionProps {
  allNodes: MediaNode[];
  currentNodes: MediaNode[];
}

export function useExplorerSelection({
  allNodes,
  currentNodes,
}: UseExplorerSelectionProps) {
  const {
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectedCount,
    replaceSelection,
    selectPaths,
    clearSelection,
    hasSelection,
  } = usePathSelectionContext();

  const { selectedNodes } = useSelectedNodes(allNodes, selectedPaths);

  const replace = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  const selectAll = () => {
    selectPaths(currentNodes.map((n) => n.path));
    enterSelectionMode();
  };

  const reset = () => {
    clearSelection();
    exitSelectionMode();
  };

  return {
    hasSelection,
    nodes: selectedNodes,
    count: selectedCount,
    replace,
    selectAll,
    reset,
  };
}
