import { useEffect, useRef, useState } from "react";

export type ScrollDirection = "up" | "down" | null;

export function useScrollDirection() {
  const [direction, setDirection] = useState<ScrollDirection>(null);

  const lastY = useRef(0);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY.current;
      lastY.current = currentY;

      // スクロールしてる間はタイマーをキャンセル
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      const canScrollUp = currentY > 200;
      const canScrollDown = currentY + clientHeight < scrollHeight - 200;

      if (delta < -2 && canScrollUp) {
        setDirection("up");
      } else if (delta > 2 && canScrollDown) {
        setDirection("down");
      }

      hideTimer.current = window.setTimeout(() => {
        setDirection(null);
      }, 500);
    };

    lastY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return direction;
}
