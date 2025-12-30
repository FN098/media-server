import { useCallback, useEffect, useState } from "react";

type GridViewConfig = {
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
};

type GridViewConfigOptions = {
  columnWidth: number;
  rowHeight?: number; // 固定したい場合
  square?: boolean; // 正方形にしたい場合
  aspectRatio?: number; // 応用（例: 16/9）
};

export function useGridViewConfig(
  ref: React.RefObject<HTMLElement | null>,
  options: GridViewConfigOptions = {
    columnWidth: 200,
    square: true,
  }
): GridViewConfig {
  const [config, setConfig] = useState<GridViewConfig>({
    columnCount: 1,
    columnWidth: options.columnWidth,
    rowHeight: options.rowHeight ?? options.columnWidth,
  });

  const update = useCallback(() => {
    if (!ref.current) return;

    const containerWidth = ref.current.offsetWidth;

    const columnCount = Math.max(
      1,
      Math.ceil(containerWidth / options.columnWidth)
    );

    const actualColumnWidth = containerWidth / columnCount;

    let rowHeight: number;

    if (options.square) {
      rowHeight = actualColumnWidth;
    } else if (options.aspectRatio) {
      rowHeight = actualColumnWidth / options.aspectRatio;
    } else {
      rowHeight = options.rowHeight ?? actualColumnWidth;
    }

    setConfig({
      columnCount,
      columnWidth: actualColumnWidth,
      rowHeight,
    });
  }, [
    ref,
    options.columnWidth,
    options.square,
    options.aspectRatio,
    options.rowHeight,
  ]);

  useEffect(() => {
    if (!ref.current) return;

    // 初期実行
    update();

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, update]);

  return config;
}
