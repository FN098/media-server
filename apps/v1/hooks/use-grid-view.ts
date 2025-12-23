"use client";

import { useCallback, useEffect, useState } from "react";

type GridViewConfig = {
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
};

export function useGridView(
  ref: React.RefObject<HTMLElement | null>,
  options: Omit<GridViewConfig, "columnCount"> = {
    columnWidth: 200,
    rowHeight: 200,
  }
): GridViewConfig {
  const [columnCount, setColumnCount] = useState(1);

  const update = useCallback(() => {
    if (!ref.current) return;

    const containerWidth = ref.current.offsetWidth;
    const newCount = Math.max(
      1,
      Math.floor(containerWidth / options.columnWidth)
    );

    setColumnCount(newCount);
  }, [ref, options.columnWidth]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // 初期実行
    update();

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, update]);

  return {
    columnCount,
    columnWidth: options.columnWidth,
    rowHeight: options.rowHeight,
  };
}
