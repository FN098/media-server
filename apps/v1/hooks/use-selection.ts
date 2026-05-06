"use client";

import { useCallback, useState } from "react";

export function useSelection<K>(initialSelectedKeys?: Iterable<K>) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(
    () => new Set(initialSelectedKeys)
  );

  const selectedCount = selectedKeys.size;

  /**
   * lastSelectedKey: 最後に触れた（移動した）キー。
   * エクスプローラー等における「フォーカス」の役割。
   */
  const [lastSelectedKey, setLastSelectedKey] = useState<K | null>(null);

  /**
   * anchorKey: 範囲選択の起点。
   * Shiftキーを押しながら移動する際、このキーから現在のキーまでを選択範囲とする。
   */
  const [anchorKey, setAnchorKey] = useState<K | null>(null);

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
    // 選択モード
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    // 選択操作
    hasSelection: selectedCount > 0,
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

    // 範囲選択用
    lastSelectedKey,
    setLastSelectedKey,
    anchorKey,
    setAnchorKey,
  };
}
