import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback } from "react";

export type FavoritesSelection = ReturnType<typeof useFavoritesSelection>;

interface UseFavoritesSelectionProps {
  listing: MediaListing;
  filtering: FavoritesFiltering;
}

export function useFavoritesSelection({
  listing,
  filtering,
}: UseFavoritesSelectionProps) {
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

  const select = useCallback(
    (nodes: MediaNode[]) => {
      const targets = nodes.map((n) => n.path);
      selectPaths(targets);
      if (targets.length > 0) enterSelectionMode();
      else exitSelectionMode();
    },
    [enterSelectionMode, exitSelectionMode, selectPaths]
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
    select,
    selectAll,
    reset,
  };
}
