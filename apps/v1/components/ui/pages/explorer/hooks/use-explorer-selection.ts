import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useSelectedNodes } from "@/hooks/selections/use-selected-nodes";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback, useEffect } from "react";

export type ExplorerSelection = ReturnType<typeof useExplorerSelection>;

interface UseExplorerSelectionProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
}

export function useExplorerSelection({
  listing,
  filtering,
}: UseExplorerSelectionProps) {
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

  const selectedNodes = useSelectedNodes({
    // IMPORTANT: フィルター済みノードを渡すと、無限レンダリングに陥るので、全ノードを渡す
    nodes: listing.nodes,
    selectedPaths,
  });

  // フィルター適用などで選択済みノードが変更された場合は、コンテキストを更新
  useEffect(() => {
    const nextPaths = selectedNodes.map((n) => n.path);

    const changed =
      nextPaths.length !== selectedPaths.size ||
      nextPaths.some((path) => !selectedPaths.has(path));

    if (changed) {
      selectPaths(nextPaths);
    }
  }, [selectedNodes, selectedPaths, selectPaths]);

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
    select(currentNodes);
  }, [currentNodes, select]);

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
