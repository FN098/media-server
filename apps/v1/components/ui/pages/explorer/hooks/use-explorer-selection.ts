import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback } from "react";

export type ExplorerSelection = ReturnType<typeof useExplorerSelection>;

interface UseExplorerSelectionProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
}

export function useExplorerSelection({
  listing,
  filtering,
}: UseExplorerSelectionProps) {
  const { nodes: allNodes } = listing;
  const { filteredNodes: currentNodes } = filtering;

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

  const replace = useCallback(
    (node: MediaNode) => {
      replaceSelection(node.path);
    },
    [replaceSelection]
  );

  const selectNodes = useCallback(
    (nodes: MediaNode[]) => {
      selectPaths(nodes.map((n) => n.path));
      enterSelectionMode();
    },
    [enterSelectionMode, selectPaths]
  );

  const selectAll = useCallback(() => {
    selectPaths(currentNodes.map((n) => n.path));
    enterSelectionMode();
  }, [currentNodes, enterSelectionMode, selectPaths]);

  const reset = useCallback(() => {
    clearSelection();
    exitSelectionMode();
  }, [clearSelection, exitSelectionMode]);

  return {
    isSelectionMode,
    hasSelection,
    selectedNodes,
    selectedCount,
    replace,
    selectAll,
    selectNodes,
    reset,
  };
}
