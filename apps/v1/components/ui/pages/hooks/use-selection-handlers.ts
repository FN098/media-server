import { SelectableNode, useSelectedNodes } from "@/hooks/use-selected-nodes";
import { usePathSelectionContext } from "@/providers/path-selection-provider";

interface UseSelectionHandlersProps<T> {
  allNodes: T[];
  currentNodes: T[];
}

export function useSelectionHandlers<T extends SelectableNode>({
  allNodes,
  currentNodes,
}: UseSelectionHandlersProps<T>) {
  const {
    isSelectionMode,
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

  const handleSelect = (node: T) => {
    replaceSelection(node.path);
  };

  const handleSelectAll = () => {
    selectPaths(currentNodes.map((n) => n.path));
    enterSelectionMode();
  };

  const handleResetSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectedCount,
    replaceSelection,
    selectPaths,
    clearSelection,
    hasSelection,
    selectedNodes,
    handleSelect,
    handleSelectAll,
    handleResetSelection,
  };
}
