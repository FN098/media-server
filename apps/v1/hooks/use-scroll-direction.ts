import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export type ScrollDirection = "up" | "down" | null;

export function useScrollDirection(minVelocity = 0.8) {
  const [direction, setDirection] = useState<ScrollDirection>(null);

  const lastY = useRef(0);
  const lastTime = useRef(0);

  const debouncedResetDirection = useDebouncedCallback(
    () => setDirection(null),
    500
  );

  // 初回マウント時のみ実行
  useEffect(() => {
    // マウントされた瞬間の値をセット
    lastY.current = window.scrollY;
    lastTime.current = performance.now();

    const onScroll = () => {
      const currentY = window.scrollY;
      const currentTime = performance.now();

      const deltaTime = currentTime - lastTime.current;
      const deltaY = currentY - lastY.current;

      // 速度 = 距離 / 時間 (px/ms)
      const velocity = Math.abs(deltaY / (deltaTime || 1));

      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      // 指定以上の速度でスクロールされた場合のみ表示
      if (velocity > minVelocity) {
        if (deltaY < 0 && currentY > 300) {
          setDirection("up");
        } else if (deltaY > 0 && currentY + clientHeight < scrollHeight - 300) {
          setDirection("down");
        }
      }

      debouncedResetDirection();

      // 現在の状態を保存
      lastY.current = currentY;
      lastTime.current = currentTime;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return direction;
}
