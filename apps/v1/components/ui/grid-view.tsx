"use client";

import { GridViewFavoriteButton } from "@/components/ui/favorite-button";
import { MediaThumb } from "@/components/ui/media-thumb";
import { TextWithTooltip } from "@/components/ui/text-with-tooltip";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { useFavorite } from "@/providers/favorite-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { memo, useRef } from "react";
import { CellComponentProps, Grid, useGridRef } from "react-window";
import { toast } from "sonner";

type GridViewProps = {
  nodes: MediaNode[];
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
  onOpen?: (target: MediaNode) => void;
};

export const GridView = memo(function GridView1({
  nodes,
  columnCount,
  columnWidth,
  rowHeight,
  onOpen,
}: GridViewProps) {
  const favoriteCtx = useFavorite();
  const rowCount = Math.ceil(nodes.length / columnCount);
  const gridRef = useGridRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const isMobile = useIsMobile();

    const index = rowIndex * columnCount + columnIndex;
    if (index >= nodes.length) return <div style={style} />;

    const node = nodes[index];

    return (
      <div style={style} className="p-1">
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-lg border bg-muted select-none",
            "hover:bg-blue-100 active:bg-blue-200 group"
          )}
          onClick={() => onOpen?.(node)}
          onDoubleClick={() => !isMobile && onOpen?.(node)}
        >
          <MediaThumb
            node={node}
            width={columnWidth}
            height={rowHeight}
            className="w-full h-full object-cover"
          />

          {/* テキストオーバーレイ */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
            <TextWithTooltip
              text={node.name}
              className="text-center text-[10px] leading-tight text-white"
              tooltipSide="bottom"
            />
          </div>

          {isMedia(node.type) && (
            <GridViewFavoriteButton
              active={favoriteCtx.isFavorite(node.path)}
              onToggle={() => {
                favoriteCtx.toggleFavorite(node.path).catch((e) => {
                  console.error(e);
                  toast.error("お気に入りの更新に失敗しました");
                });
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <Grid
        gridRef={gridRef}
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={columnWidth}
        rowHeight={rowHeight}
        cellComponent={Cell}
        cellProps={{}}
      />
    </div>
  );
});
