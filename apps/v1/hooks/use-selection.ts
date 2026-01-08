"use client";

import { useCallback, useState } from "react";

export function useSelection<K>(initialSelectedKeys?: Iterable<K>) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(
    () => new Set(initialSelectedKeys)
  );

  const [lastSelectedKey, setLastSelectedKey] = useState<K | null>(null);

  const selectedCount = selectedKeys.size;

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
  }, []);

  const isSelected = useCallback(
    (key: K) => selectedKeys.has(key),
    [selectedKeys]
  );

  const toggleKey = useCallback((key: K) => {
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

  const addKeys = useCallback((keys: Iterable<K>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of keys) next.add(key);
      return next;
    });
  }, []);

  const deleteKeys = useCallback((keys: Iterable<K>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of keys) next.delete(key);
      return next;
    });
  }, []);

  const replaceSelection = useCallback((key: K) => {
    setSelectedKeys(new Set([key]));
  }, []);

  return {
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
  };
}
