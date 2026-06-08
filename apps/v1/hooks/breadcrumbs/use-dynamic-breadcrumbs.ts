import { BreadcrumbLinkItem } from "@/components/ui/breadcrumbs/types";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

type DisplayMode = "full" | "first-last" | "ellipsis-last";

const PADDING = 32;
const ICON_WIDTH = 32;
const ELLIPSIS_WIDTH = 32;
const AVG_CHAR_WIDTH = 12;

const getWidth = (item: BreadcrumbLinkItem) =>
  item.key === "home" ? ICON_WIDTH : item.label.length * AVG_CHAR_WIDTH + 16;

interface UseDynamicBreadcrumbsProps {
  items: BreadcrumbLinkItem[];
}

export function useDynamicBreadcrumbs({ items }: UseDynamicBreadcrumbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const first = items[0];
  const last = items[items.length - 1];
  const middle = items.slice(1, -1);

  // 幅の計算ロジック（概算）
  const firstWidth = useMemo(() => getWidth(first), [first]);
  const lastWidth = useMemo(() => getWidth(last), [last]);
  const totalFullWidth = useMemo(
    () =>
      items.reduce((acc, item) => acc + getWidth(item), 0) +
      items.length * PADDING,
    [items]
  );

  // 表示モードの判定
  const displayMode = useMemo<DisplayMode>(() => {
    if (containerWidth === 0) return "full";

    if (totalFullWidth <= containerWidth) {
      return "full";
    } else if (
      firstWidth + lastWidth + ELLIPSIS_WIDTH + PADDING * 3 <=
      containerWidth
    ) {
      return "first-last";
    } else {
      return "ellipsis-last";
    }
  }, [containerWidth, firstWidth, lastWidth, totalFullWidth]);

  return { items, containerRef, displayMode, first, middle, last };
}
