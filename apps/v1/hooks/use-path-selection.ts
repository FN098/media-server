import { useSelection } from "@/hooks/use-selection";

export function usePathSelection(initialSelectedPaths?: Iterable<string>) {
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
  } = useSelection<string>(initialSelectedPaths);

  return {
    // 選択モード
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    // 選択操作
    hasSelection,
    selectedCount,
    selectedPaths: selectedKeys,
    isSelectedPath: isSelected,
    togglePath: toggleKey,
    selectPaths: selectKeys,
    clearSelection,
    selectPath: selectKey,
    unselectPath: unselectKey,
    addPaths: addKeys,
    deletePaths: deleteKeys,
    replaceSelection,

    // 範囲選択用
    lastSelectedPath: lastSelectedKey,
    setLastSelectedPath: setLastSelectedKey,
    anchorPath: anchorKey,
    setAnchorPath: setAnchorKey,
  };
}
