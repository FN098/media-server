import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback, useEffect, useMemo } from "react";

export type ExplorerSelection = ReturnType<typeof useExplorerSelection>;

interface UseExplorerSelectionProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  enableFolderSelection?: boolean;
}

export function useExplorerSelection({
  listing,
  filtering,
  enableFolderSelection = true,
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
    lastSelectedPath,
  } = usePathSelectionContext();

  // path -> node を O(1) で検索するためのマップ
  const nodeMap = useMemo(
    () => new Map(listing.nodes.map((n) => [n.path, n])),
    [listing.nodes]
  );

  const lastSelectedNode = useMemo(
    () => (lastSelectedPath ? nodeMap.get(lastSelectedPath) : null),
    [lastSelectedPath, nodeMap]
  );

  const selectedNodes = useMemo(() => {
    return Array.from(selectedPaths)
      .map((path) => nodeMap.get(path))
      .filter((node) => node != null)
      .filter((node) => enableFolderSelection || !node.isDirectory);
  }, [enableFolderSelection, nodeMap, selectedPaths]);

  // TODO: パフォーマンス上の問題がある（全選択時などにかくつく）
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
    lastSelectedNode,
    hasSelection,
    selectedNodes,
    selectedCount,
    replace,
    select,
    selectAll,
    reset,
  };
}
