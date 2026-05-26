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

  const handleSelect = (node: MediaNode) => {
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
