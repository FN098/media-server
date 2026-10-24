import { useCallback, useState } from "react";

export function useNodeSelection() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [selectedIds, setSelectedKeys] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;

  /**
   * lastSelectedKey: 最後に触れた（移動した）キー。
   * エクスプローラー等における「フォーカス」の役割。
   */
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  /**
   * anchorKey: 範囲選択の起点。
   * Shiftキーを押しながら移動する際、このキーから現在のキーまでを選択範囲とする。
   */
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
  }, []);

  const isSelectedId = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleId = useCallback((id: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectIds = useCallback((ids: Iterable<string>) => {
    setSelectedKeys(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const selectId = useCallback((id: string) => {
    setSelectedKeys((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unselectId = useCallback((id: string) => {
    setSelectedKeys((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const addIds = useCallback((ids: Iterable<string>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of ids) next.add(key);
      return next;
    });
  }, []);

  const deleteIds = useCallback((ids: Iterable<string>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of ids) next.delete(key);
      return next;
    });
  }, []);

  const replaceSelection = useCallback((id: string) => {
    setSelectedKeys(new Set([id]));
  }, []);

  return {
    // 選択モード
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,

    // 選択操作
    hasSelection: selectedCount > 0,
    selectedCount,
    selectedIds,
    isSelectedId,
    toggleId,
    selectIds,
    clearSelection,
    selectId,
    unselectId,
    addIds,
    deleteIds,
    replaceSelection,

    // 範囲選択用
    lastSelectedId,
    setLastSelectedId,
    anchorId,
    setAnchorId,
  };
}

export type NodeSelection = ReturnType<typeof useNodeSelection>;
