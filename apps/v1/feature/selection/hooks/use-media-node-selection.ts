import { usePathSelectionContext } from "@/feature/selection/providers/path-selection-provider";
import { MediaNode } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export type MediaNodeSelection = ReturnType<typeof useMediaNodeSelection>;

interface UseMediaNodeSelectionProps {
  allNodes: MediaNode[];
  activeNodes: MediaNode[];
  enableFolderSelection?: boolean;
}

export function useMediaNodeSelection({
  allNodes,
  activeNodes,
  enableFolderSelection = true,
}: UseMediaNodeSelectionProps) {
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
    () => new Map(allNodes.map((n) => [n.path, n])),
    [allNodes]
  );

  const lastSelectedNode = useMemo(
    () => (lastSelectedPath ? nodeMap.get(lastSelectedPath) : null),
    [lastSelectedPath, nodeMap]
  );

  const selectedNodes = useMemo(() => {
    return Array.from(selectedPaths)
      .map((path) => nodeMap.get(path))
      .filter((node) => node != null)
      .filter((node) => enableFolderSelection || !node.isDirectory); // フォルダ選択無効ならフォルダ除外
  }, [enableFolderSelection, nodeMap, selectedPaths]);

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
    select(activeNodes);
  }, [activeNodes, select]);

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
