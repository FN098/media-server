import { cn } from "@/shadcn/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type MarqueeTextProps = {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  autoplay?: boolean;
};

export function MarqueeText({
  text,
  className,
  speed = 40,
  delay = 0.5,
  autoplay = false,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [scrollDistance, setScrollDistance] = useState(0);
  const [playing, setPlaying] = useState(false);

  const isInteracting = useRef(false); // マウスホバー状態
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 移動量計算
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const textEl = textRef.current;
      if (!textEl) return;
      const diff = textEl.scrollWidth - container.clientWidth;
      setScrollDistance(diff > 0 ? diff : 0);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // アニメーション開始
  const startAnimation = useCallback(() => {
    if (scrollDistance <= 0) return;

    timerRef.current = setTimeout(() => {
      setPlaying(true);
    }, delay * 1000);
  }, [scrollDistance, delay]);

  // 初回起動（autoplay用）
  useEffect(() => {
    if (autoplay && scrollDistance > 0) {
      startAnimation();
    }
  }, [autoplay, scrollDistance, startAnimation]);

  const stop = () => {
    isInteracting.current = false;
    if (!autoplay) {
      setPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const onAnimationEnd = () => {
    // 終了時の待機
    timerRef.current = setTimeout(() => {
      // 一旦リセット（CSSのanimationを再適用させるため）
      setPlaying(false);

      // autoplay中、またはマウスホバー中なら再開
      if (autoplay || isInteracting.current) {
        timerRef.current = setTimeout(() => {
          startAnimation();
        }, delay * 1000);
      }
    }, delay * 1000);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group w-full overflow-hidden whitespace-nowrap",
        className
      )}
      onMouseEnter={() => {
        isInteracting.current = true;
        if (!playing) startAnimation();
      }}
      onMouseLeave={stop}
    >
      <span
        ref={textRef}
        onAnimationEnd={onAnimationEnd}
        className={cn(
          "inline-block",
          playing && "[animation:marquee-once_var(--duration)_linear_forwards]"
        )}
        style={
          {
            "--scroll-distance": `-${scrollDistance}px`,
            "--duration": `${scrollDistance / speed}s`,
          } as React.CSSProperties
        }
      >
        {text}
      </span>
    </div>
  );
}
