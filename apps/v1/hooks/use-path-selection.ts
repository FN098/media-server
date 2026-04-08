"use client";

import { useSelection } from "@/hooks/use-selection";

export function usePathSelection(initialSelectedPaths?: Iterable<string>) {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
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
  } = useSelection<string>(initialSelectedPaths);

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
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
    lastSelectedPath: lastSelectedKey,
    setLastSelectedPath: setLastSelectedKey,
  };
}
