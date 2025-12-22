import { cn } from "@/shadcn/lib/utils";
import { useEffect, useRef, useState } from "react";

type MarqueeTextProps = {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
};

export function MarqueeText({
  text,
  className,
  speed = 40,
  delay = 0.5,
}: MarqueeTextProps) {
  const startDelay = delay;
  const endDelay = delay * 2;

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [scrollDistance, setScrollDistance] = useState(0);
  const [playing, setPlaying] = useState(false);

  const hoverRef = useRef(false);
  const timerRef = useRef<number | null>(null);

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

  const start = () => {
    if (!hoverRef.current || scrollDistance <= 0) return;

    timerRef.current = window.setTimeout(() => {
      setPlaying(true);
    }, delay * 1000);
  };

  const stop = () => {
    hoverRef.current = false;
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const onAnimationEnd = () => {
    // 終端待機 → リセット → 再スタート
    timerRef.current = window.setTimeout(() => {
      if (!hoverRef.current) return;

      setPlaying(false);
      if (textRef.current) {
        textRef.current.style.transform = "translateX(0)";
      }

      // さらに少し待ってから再開
      timerRef.current = window.setTimeout(() => {
        if (!hoverRef.current) return;
        start();
      }, startDelay * 1000);
    }, endDelay * 1000);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group w-full overflow-hidden whitespace-nowrap",
        className
      )}
      onMouseEnter={() => {
        hoverRef.current = true;
        start();
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
