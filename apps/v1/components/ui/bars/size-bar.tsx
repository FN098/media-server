import { formatBytes } from "@/lib/utils/format";

interface SizeBarProps {
  pattern?: "A" | "B" | "C";
  size?: number;
  fileCount?: number;
  sizeRatio: number;
  occupancyPercent: number;
}

export function SizeBar({
  pattern,
  sizeRatio,
  size,
  fileCount,
  occupancyPercent,
}: SizeBarProps) {
  // Aパターン
  if (pattern === "A") {
    return (
      <div className="hidden md:flex items-center gap-3 relative w-full h-full pr-4 overflow-hidden select-none">
        {/* 棒グラフ */}
        <div className="relative w-20 h-4 bg-muted rounded-full overflow-hidden shrink-0 flex items-center justify-center">
          {sizeRatio > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-primary/70 rounded-full transition-all duration-300"
              style={{ width: `${sizeRatio}%` }}
            />
          )}

          {occupancyPercent > 0 && (
            <span className="z-10 text-[9px] font-bold text-muted-foreground mix-blend-difference tracking-tighter scale-90 origin-center">
              {occupancyPercent}%
            </span>
          )}
        </div>

        {/* テキスト */}
        <div className="flex flex-col min-w-0">
          <span className="text-foreground font-medium text-xs tabular-nums">
            {size ? formatBytes(size) : "-"}
          </span>
          {fileCount ? (
            <span className="text-[10px] text-muted-foreground/80 tracking-wider">
              {fileCount} files
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // Bパターン
  if (pattern === "B") {
    return (
      <div className="hidden md:flex items-center relative w-full h-full pl-2 pr-4 overflow-hidden">
        {/* 棒グラフ */}
        {sizeRatio > 0 && (
          <div
            className="absolute left-2 bg-primary/10 rounded-md pointer-events-none transition-all duration-300 h-7"
            style={{
              width: `calc(${sizeRatio}% - 24px)`,
              minWidth: "48px", // テキストが乗る最小限の土台を確保
            }}
          />
        )}

        {/* コンテンツ */}
        <div className="z-10 flex items-baseline gap-1.5 pl-2 select-none">
          <span className="text-foreground font-semibold text-xs tabular-nums">
            {size ? formatBytes(size) : "-"}
          </span>
          {/* 比率（%）を少し目立たない色で挿入 */}
          {occupancyPercent > 0 && (
            <span className="text-[10px] font-medium text-primary/70 tabular-nums">
              ({occupancyPercent}%)
            </span>
          )}
          {fileCount ? (
            <span className="text-[10px] text-muted-foreground font-normal border-l pl-1.5 border-muted-foreground/30">
              {fileCount} files
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // Cパターン（デフォルト）
  return (
    <div className="hidden md:flex items-center relative w-full h-full pl-2 pr-4 overflow-hidden select-none">
      {/* 棒グラフ */}
      <div className="relative w-full h-8 bg-muted rounded-md overflow-hidden shrink-0 flex items-center justify-center">
        {sizeRatio > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary/15 transition-all duration-300"
            style={{ width: `${sizeRatio}%` }}
          />
        )}

        {/* テキスト */}
        <div className="z-10 flex items-center justify-center gap-2 px-3 w-full text-xs tabular-nums font-medium">
          {/* サイズ */}
          <span className="text-foreground">
            {size ? formatBytes(size) : "-"}
          </span>

          {/* 占有率 */}
          <span className="text-[10px] text-primary font-semibold bg-background/60 px-1 rounded-sm">
            {occupancyPercent}%
          </span>

          {/* ファイル数 */}
          {fileCount ? (
            <span className="text-[10px] text-muted-foreground/80 font-normal border-l pl-2 border-muted-foreground/30">
              {fileCount} files
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
