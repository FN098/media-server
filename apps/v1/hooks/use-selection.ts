import { useCallback, useState } from "react";

export function useSelection<K>(initialSelectedKeys?: Iterable<K>) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(
    () => new Set(initialSelectedKeys)
  );

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

  const selectKey = useCallback((key: K) => {
    setSelectedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const unselectKey = useCallback((key: K) => {
    setSelectedKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedKeys,
    isSelected,
    toggleSelection,
    selectKeys,
    clearSelection,
    selectKey,
    unselectKey,
  };
}
