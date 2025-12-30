"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { MarqueeText } from "@/components/ui/marquee-text";
import { MediaThumb } from "@/components/ui/media-thumb";
import { useGridViewConfig } from "@/hooks/use-grid-view";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useFavorite } from "@/providers/favorite-provider";
import { useSelection } from "@/providers/selection-provider";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef } from "react";
import { toast } from "sonner";

type GridViewProps = {
  nodes: MediaNode[];
  onOpen?: (target: MediaNode, index: number) => void;
};

export const GridView = memo(function GridView1({
  nodes,
  onOpen,
}: GridViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { columnCount, rowHeight } = useGridViewConfig(parentRef, {
    columnWidth: 200,
  });
  const rowCount = Math.ceil(nodes.length / columnCount);

  // 仮想グリッドの設定
  // eslint-disable-next-line react-hooks/incompatible-library -- メモ化すると正しく動作しないという警告を無効化。無視しても実害はない
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight, // 各行の高さ
    overscan: 1, // 画面外に何行予備を持っておくか
  });

  return (
    <div ref={parentRef} className="w-full h-full flex flex-col">
      {/* グリッド */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* 行 */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              display: "grid",
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            }}
          >
            {/* セル */}
            {Array.from({ length: columnCount }).map((_, colIndex) => {
              const index = virtualRow.index * columnCount + colIndex;
              const node = nodes[index];
              return (
                node && (
                  <Cell
                    key={node.path}
                    node={node}
                    onOpen={onOpen ? () => onOpen?.(node, index) : undefined}
                  />
                )
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

type CellProps = {
  node: MediaNode;
  onOpen?: () => void;
};

function Cell({ node, onOpen }: CellProps) {
  const favoriteCtx = useFavorite();
  const toggleFavorite = async (node: MediaNode) => {
    try {
      await favoriteCtx.toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  const { isSelected, isSelectionMode, toggleSelection } = useSelection();
  const selected = isSelected(node.id);

  return (
    <div className="p-1 w-full h-full">
      <div
        className={cn(
          "relative group w-full h-full overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all",
          selected
            ? "ring-2 ring-primary border-transparent"
            : "hover:border-primary/50"
        )}
        onClick={() => {
          if (isSelectionMode) {
            toggleSelection(node.id);
          } else {
            onOpen?.();
          }
        }}
      >
        {/* サムネイル */}
        <MediaThumb
          node={node}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 選択チェックボックス */}
        <div
          className={cn(
            "absolute top-2 left-2 transition-opacity",
            isSelectionMode
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={() => toggleSelection(node.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* テキストオーバーレイ */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
          <MarqueeText
            text={node.title ?? node.name}
            className="text-center text-[10px] leading-tight text-white"
          />
        </div>

        {/* お気に入りボタン */}
        {!isSelectionMode && isMedia(node.type) && (
          <FavoriteButton
            variant="grid"
            active={favoriteCtx.isFavorite(node.path)}
            onToggle={() => void toggleFavorite(node)}
            className="absolute top-1 right-1"
          />
        )}

        {/* ステータスバッジ */}
        {node.isDirectory && (
          <FolderStatusBadge
            date={node.lastViewedAt}
            className="absolute top-1 right-1"
          />
        )}

        {/* ★ お気に入り数バッジ */}
        {node.isDirectory && (
          <FavoriteCountBadge
            count={node.favoriteCount ?? 0}
            className="absolute top-1 left-1"
          />
        )}
      </div>
    </div>
  );
}
