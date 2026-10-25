import { useNodeSelectionContext } from "@/__feature/selection/providers/node-selection-provider";
import { Node } from "@/lib/node/types";
import { useCallback, useMemo } from "react";

export type NodeSelectionControl = ReturnType<typeof useNodeSelectionControl>;

interface UseNodeSelectionControlProps {
  allNodes: Node[];
  activeNodes: Node[];
  enableFolderSelection?: boolean;
}

export function useNodeSelectionControl({
  allNodes,
  activeNodes,
  enableFolderSelection = true,
}: UseNodeSelectionControlProps) {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedIds,
    selectedCount,
    replaceSelection,
    selectIds,
    clearSelection,
    hasSelection,
    lastSelectedId,
  } = useNodeSelectionContext();

  // id -> node を O(1) で検索するためのマップ
  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes]
  );

  const lastSelectedNode = useMemo(
    () => (lastSelectedId ? nodeMap.get(lastSelectedId) : null),
    [lastSelectedId, nodeMap]
  );

  const selectedNodes = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => nodeMap.get(id))
      .filter((node) => node != null)
      .filter((node) => enableFolderSelection || !node.isDirectory); // フォルダ選択無効ならフォルダ除外
  }, [enableFolderSelection, nodeMap, selectedIds]);

  const replace = useCallback(
    (node: Node) => {
      replaceSelection(node.id);
    },
    [replaceSelection]
  );

  const select = useCallback(
    (nodes: Node[]) => {
      const targets = nodes.map((n) => n.id);
      selectIds(targets);
      if (targets.length > 0) enterSelectionMode();
      else exitSelectionMode();
    },
    [enterSelectionMode, exitSelectionMode, selectIds]
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
