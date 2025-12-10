import { useEffect, useState } from "react";

export function useGridConfig(ref: React.RefObject<HTMLElement | null>) {
  const [config, setConfig] = useState({
    columnCount: 6,
    columnWidth: 200,
    rowHeight: 220,
    isReady: false,
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;

      // 列数は任意で設定
      const columnCount =
        width < 480 ? 2 : width < 768 ? 3 : width < 1024 ? 4 : 6;
      const columnWidth = Math.floor(width / columnCount);
      const rowHeight = Math.floor(columnWidth * 1.1);

      setConfig({ columnCount, columnWidth, rowHeight, isReady: true });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return config;
}
