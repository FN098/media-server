"use client";

import { useCallback, useEffect, useState } from "react";

type GridConfig = {
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
};

type GridConfigOptions = {
  columnWidth: number;
  rowHeight?: number; // 固定したい場合
  square?: boolean; // 正方形にしたい場合
  aspectRatio?: number; // 応用（例: 16/9）
};

export function useGridConfig(
  containerRef: React.RefObject<HTMLElement | null>,
  options?: GridConfigOptions
): GridConfig {
  const columnWidth = options?.columnWidth ?? 200;
  const rowHeight = options?.rowHeight ?? columnWidth;
  const square = options?.square ?? true;
  const aspectRatio = options?.aspectRatio;

  const [config, setConfig] = useState<GridConfig>({
    columnCount: 1,
    columnWidth: columnWidth,
    rowHeight: rowHeight,
  });

  const update = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const nextColumnCount = Math.max(
      1,
      Math.ceil(containerWidth / columnWidth)
    );
    const nextColumnWidth = containerWidth / nextColumnCount;

    let nextRowHeight: number;
    if (square) {
      nextRowHeight = nextColumnWidth;
    } else if (aspectRatio) {
      nextRowHeight = nextColumnWidth / aspectRatio;
    } else {
      nextRowHeight = rowHeight ?? nextColumnWidth;
    }

    setConfig({
      columnCount: nextColumnCount,
      columnWidth: nextColumnWidth,
      rowHeight: nextRowHeight,
    });
  }, [containerRef, columnWidth, square, aspectRatio, rowHeight]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初回計算
    update();

    // リサイズ時に再計算
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, update]);

  return config;
}
