import { useCallback, useEffect, useState } from "react";

type GridViewConfig = {
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
};

export function useGridViewConfig(
  ref: React.RefObject<HTMLElement | null>,
  options: Omit<GridViewConfig, "columnCount"> = {
    columnWidth: 200,
    rowHeight: 200,
  }
): GridViewConfig {
  const [config, setConfig] = useState<GridViewConfig>({
    columnCount: 1,
    columnWidth: options.columnWidth,
    rowHeight: options.rowHeight,
  });

  const update = useCallback(() => {
    if (!ref.current) return;

    const containerWidth = ref.current.offsetWidth;
    const columnCount = Math.max(
      1,
      Math.ceil(containerWidth / options.columnWidth)
    );

    const actualColumnWidth = containerWidth / columnCount;

    setConfig({
      columnCount,
      columnWidth: actualColumnWidth,
      rowHeight: options.rowHeight,
    });
  }, [ref, options.columnWidth, options.rowHeight]);

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

  return config;
}
