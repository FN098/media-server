import { useCallback, useMemo, useState } from "react";

export function useSelection<K>(initialSelectedKeys?: Iterable<K>) {
  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(
    () => new Set(initialSelectedKeys)
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectedCount = selectedKeys.size;

  const isSelected = useCallback(
    (key: K) => selectedKeys.has(key),
    [selectedKeys]
  );

  const toggleSelection = useCallback((key: K) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectKeys = useCallback((keys: Iterable<K>) => {
    setSelectedKeys(new Set(keys));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  return useMemo(
    () => ({
      selectedKeys,
      isSelectionMode,
      selectedCount,
      setIsSelectionMode,
      isSelected,
      toggleSelection,
      selectKeys,
      clearSelection,
    }),
    [
      selectedKeys,
      isSelectionMode,
      selectedCount,
      isSelected,
      toggleSelection,
      selectKeys,
      clearSelection,
    ]
  );
}
