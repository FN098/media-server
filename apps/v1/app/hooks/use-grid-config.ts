import { useEffect, useState } from "react";

export function useGridConfig(ref: React.RefObject<HTMLElement | null>) {
  const [config, setConfig] = useState({
    columnCount: 6,
    columnWidth: 200,
    rowHeight: 220,
  });

  useEffect(() => {
    if (!ref.current) return;

    const update = () => {
      const width = ref.current!.offsetWidth;
      const columnCount =
        width < 480 ? 2 : width < 768 ? 3 : width < 1024 ? 4 : 6;
      const columnWidth = Math.floor(width / columnCount);
      const rowHeight = Math.floor(columnWidth * 1.1);

      if (
        config.columnCount === columnCount &&
        Math.abs(config.columnWidth - columnWidth) < 100
      )
        return;

      setConfig({ columnCount, columnWidth, rowHeight });
    };

    update(); // 初回呼び出しでマウント時に正しい値を反映

    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return config;
}
