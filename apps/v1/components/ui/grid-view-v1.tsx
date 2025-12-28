"use client";

import { GridViewFavoriteButton } from "@/components/ui/favorite-button";
import { MarqueeText } from "@/components/ui/marquee-text";
import { MediaThumb } from "@/components/ui/media-thumb";
import { useGridViewConfig } from "@/hooks/use-grid-view";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { useFavorite } from "@/providers/favorite-provider";
import { cn } from "@/shadcn/lib/utils";
import { memo, useRef } from "react";
import { CellComponentProps, Grid } from "react-window";
import { toast } from "sonner";

type GridViewProps = {
  nodes: MediaNode[];
  onOpen?: (target: MediaNode, index: number) => void;
};

// NOTE: 大量ファイルのあるフォルダ表示が重たい、メディアビューアのレスポンスが遅れるなどの問題あり
export const GridView = memo(function GridView1({
  nodes,
  onOpen,
}: GridViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const favoriteCtx = useFavorite();
  const { columnCount, columnWidth, rowHeight } = useGridViewConfig(parentRef);
  const rowCount = Math.ceil(nodes.length / columnCount);

  const handleToggleFavorite = async (node: MediaNode) => {
    try {
      await favoriteCtx.toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const node = nodes[index];
    if (!node) return <div style={style} />;

    return (
      <div style={style} className="p-1">
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-lg border bg-muted select-none",
            "hover:bg-blue-100 active:bg-blue-200 group"
          )}
          onClick={() => onOpen?.(node, index)}
        >
          {/* サムネイル */}
          <MediaThumb node={node} className="w-full h-full object-cover" />

          {/* テキストオーバーレイ */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
            <MarqueeText
              text={node.name}
              className="text-center text-[10px] leading-tight text-white"
            />
          </div>

          {/* お気に入りボタン */}
          {isMedia(node.type) && (
            <GridViewFavoriteButton
              active={favoriteCtx.isFavorite(node.path)}
              onToggle={() => void handleToggleFavorite(node)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={parentRef} className="w-full h-full">
      <Grid
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
