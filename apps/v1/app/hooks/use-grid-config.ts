import { useEffect, useState } from "react";

export function useGridConfig(ref: React.RefObject<HTMLElement | null>) {
  const [config, setConfig] = useState({
    columnCount: 6,
    columnWidth: 200,
    rowHeight: 220,
  });

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const update = () => {
      const width = el.offsetWidth;

      const columnWidth = 200;
      const columnCount = Math.max(1, Math.floor(width / columnWidth));

      setConfig({
        columnCount,
        columnWidth,
        rowHeight: 220,
      });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);

    // 初回計算
    update();

    return () => observer.disconnect();
  }, [ref]);

  return config;
}
