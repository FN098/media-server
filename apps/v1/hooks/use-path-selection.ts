import { useSelection } from "@/hooks/use-selection";
import { PathType } from "@/lib/path/types";

export function usePathSelection(initialSelectedPaths?: Iterable<PathType>) {
  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedKeys,
    isSelected,
    toggleKey: toggleSelection,
    selectKeys,
    clearSelection,
    selectKey,
    unselectKey,
  } = useSelection<PathType>(initialSelectedPaths);

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    selectedPaths: selectedKeys,
    isPathSelected: isSelected,
    togglePath: toggleSelection,
    selectPaths: selectKeys,
    clearSelection,
    selectPath: selectKey,
    unselectPath: unselectKey,
  };
}
