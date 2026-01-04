"use client";

import { useGridConfig } from "@/hooks/use-grid-config";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef } from "react";

export function useGridView<T>(items: T[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { columnCount, rowHeight } = useGridConfig(containerRef, {
    columnWidth: 200,
  });

  const rowCount = useMemo(
    () => Math.ceil(items.length / columnCount),
    [columnCount, items.length]
  );

  // 仮想グリッドの設定
  // eslint-disable-next-line react-hooks/incompatible-library -- メモ化すると正しく動作しないという警告を無視
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight, // 各行の高さ
    overscan: 1, // 画面外に何行予備を持っておくか
  });

  const getCellIndex = useCallback(
    (rowIndex: number, colIndex: number) => {
      return rowIndex * columnCount + colIndex;
    },
    [columnCount]
  );

  const getCellItem = useCallback(
    (rowIndex: number, colIndex: number) => {
      const index = getCellIndex(rowIndex, colIndex);
      if (index < 0 || index >= items.length) return null;
      return items[index];
    },
    [getCellIndex, items]
  );

  const getTotalHeight = rowVirtualizer.getTotalSize;
  const getRows = rowVirtualizer.getVirtualItems;

  return useMemo(
    () => ({
      items,
      containerRef,
      columnCount,
      rowHeight,
      rowCount,
      getCellIndex,
      getCellItem,
      getTotalHeight,
      getRows,
    }),
    [
      items,
      columnCount,
      rowHeight,
      rowCount,
      getCellIndex,
      getCellItem,
      getTotalHeight,
      getRows,
    ]
  );
}
