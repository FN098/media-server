import { useSelection } from "@/feature/selection/hooks/use-selection";

export function useNodeSelection() {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    hasSelection,
    selectedCount,
    selectedKeys,
    isSelected,
    toggleKey,
    selectKeys,
    clearSelection,
    selectKey,
    unselectKey,
    addKeys,
    deleteKeys,
    replaceSelection,
    lastSelectedKey,
    setLastSelectedKey,
    anchorKey,
    setAnchorKey,
  } = useSelection<string>();

  return {
    // 選択モード
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    // 選択操作
    hasSelection,
    selectedCount,
    selectedIds: selectedKeys,
    isSelectedId: isSelected,
    toggleId: toggleKey,
    selectIds: selectKeys,
    clearSelection,
    selectId: selectKey,
    unselectId: unselectKey,
    addIds: addKeys,
    deleteIds: deleteKeys,
    replaceSelection,

    // 範囲選択用
    lastSelectedId: lastSelectedKey,
    setLastSelectedId: setLastSelectedKey,
    anchorId: anchorKey,
    setAnchorId: setAnchorKey,
  };
}

export type NodeSelection = ReturnType<typeof useNodeSelection>;
