import { cn } from "@/shadcn/lib/utils";
import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

interface FilterResultTextProps {
  filteredCount: number;
  totalCount: number;
  isFiltered?: boolean;
  className?: string;
}

export const FilterResultText = ({
  filteredCount,
  totalCount,
  isFiltered,
  className,
}: FilterResultTextProps) => {
  // springCount は常に現在の「アニメーション途中の値」を保持します
  const springCount = useSpring(filteredCount, {
    mass: 0.5, // 重さ（少し重くすると高級感が出ます）
    stiffness: 120, // 硬さ（高くするとキビキビ動きます）
    damping: 20, // 振幅の収まりやすさ
  });

  const [displayCount, setDisplayCount] = useState(filteredCount);

  useEffect(() => {
    // filteredCount が変わるたびに、現在の値から新しい値へ向かって
    // 自動的にカウントアップ/ダウンが始まります
    springCount.set(filteredCount);

    // 数値の変化を監視して整数に丸める
    const unsubscribe = springCount.on("change", (latest) => {
      setDisplayCount(Math.round(latest));
    });

    return () => unsubscribe();
  }, [filteredCount, springCount]);

  return (
    <div
      className={cn("flex items-center h-10 gap-3 mx-2 select-none", className)}
    >
      <div className="h-4 w-[1px] bg-border/60" />

      <div className="flex flex-col items-end gap-0">
        <div className="flex items-baseline gap-1.5 leading-none">
          {/* 数字が動くときに色がフワッと変わるように transition を追加 */}
          <span
            className={cn(
              "tabular-nums font-bold tracking-tight transition-all duration-500",
              isFiltered ? "text-primary" : "text-foreground"
            )}
          >
            {displayCount.toLocaleString()}
          </span>

          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 opacity-80">
            <span className="opacity-40">/</span>
            <span className="tabular-nums">{totalCount.toLocaleString()}</span>
            <span className="ml-0.5 tracking-tighter uppercase text-[10px] opacity-70">
              items
            </span>
          </span>
        </div>

        {/* 下部の "Filtered" ラベルもフワッと出す */}
        <div className="overflow-hidden">
          {isFiltered && (
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[9px] font-bold text-primary/70 uppercase tracking-widest block mt-0.5"
            >
              Filtered
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
};
