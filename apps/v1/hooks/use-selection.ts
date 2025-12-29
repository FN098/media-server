import { useCallback, useState } from "react";

export function useSelection<T extends { path: string }>(items: T[]) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedPaths.size > 0;

  const toggleSelection = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPaths(new Set(items.map((item) => item.path)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  const isSelected = useCallback(
    (path: string) => selectedPaths.has(path),
    [selectedPaths]
  );

  return {
    selectedPaths,
    isSelectionMode,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}
