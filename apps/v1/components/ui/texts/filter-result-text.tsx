import { cn } from "@/shadcn/lib/utils";

interface FilterResultTextProps {
  filteredCount: number;
  totalCount: number;
  className?: string;
}

export const FilterResultText = ({
  filteredCount,
  totalCount,
  className,
}: FilterResultTextProps) => {
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className={cn("flex items-center gap-3 ml-auto", className)}>
      {/* 視覚的なセパレーター（左側の線） */}
      <div className="h-4 w-[1px] bg-border/60" />

      <div className="flex flex-col items-end gap-0">
        <div className="flex items-baseline gap-1.5 leading-none">
          {/* フィルタリング中のみ「見つかった数」を強調 */}
          <span
            className={cn(
              "tabular-nums font-bold tracking-tight transition-colors",
              isFiltered ? "text-primary text-lg" : "text-foreground text-sm"
            )}
          >
            {filteredCount.toLocaleString()}
          </span>

          {/* 総数との対比 */}
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <span className="opacity-50">/</span>
            <span className="tabular-nums">{totalCount.toLocaleString()}</span>
            <span className="ml-0.5 tracking-tighter uppercase text-[10px] opacity-70">
              items
            </span>
          </span>
        </div>

        {/* 状態表示（フィルタリング中のみ表示） */}
        {isFiltered && (
          <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest leading-none mt-1">
            Filtered
          </span>
        )}
      </div>
    </div>
  );
};
