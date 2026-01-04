"use client";

import { useSelection } from "@/hooks/use-selection";
import { PathType } from "@/lib/path/types";

export function usePathSelection(initialSelectedPaths?: Iterable<PathType>) {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    selectedKeys,
    isSelected,
    toggleKey,
    selectKeys,
    clearSelection,
    selectKey,
    unselectKey,
    addKeys,
    replaceSelection,

    lastSelectedKey,
    setLastSelectedKey,
  } = useSelection<PathType>(initialSelectedPaths);

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    selectedPaths: selectedKeys,
    isPathSelected: isSelected,
    togglePath: toggleKey,
    selectPaths: selectKeys,
    clearSelection,
    selectPath: selectKey,
    unselectPath: unselectKey,
    addPaths: addKeys,
    replaceSelection,

    lastSelectedPath: lastSelectedKey,
    setLastSelectedPath: setLastSelectedKey,
  };
}
