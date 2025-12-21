"use client";

import { useEffect, useState } from "react";

type GridViewConfig = {
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
};

export function useGridView(
  ref: React.RefObject<HTMLElement | null>
): GridViewConfig {
  const [config, setConfig] = useState<GridViewConfig>({
    columnCount: 6,
    columnWidth: 200,
    rowHeight: 220,
  });

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const update = () => {
      const width = el.offsetWidth;
      const columnCount =
        width < 480 ? 2 : width < 768 ? 3 : width < 1024 ? 4 : 6;
      const columnWidth = Math.floor(width / columnCount);
      const rowHeight = Math.floor(columnWidth * 1.1);

      setConfig({ columnCount, columnWidth, rowHeight });
    };

    update(); // 初回呼び出しでマウント時に正しい値を反映

    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return config;
}
