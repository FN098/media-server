"use client";

import { GridViewFavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { MarqueeText } from "@/components/ui/marquee-text";
import { MediaThumb } from "@/components/ui/media-thumb";
import { useGridViewConfig } from "@/hooks/use-grid-view";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { useFavorite } from "@/providers/favorite-provider";
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
  const favoriteCtx = useFavorite();
  const { columnCount, rowHeight } = useGridViewConfig(parentRef);
  const rowCount = Math.ceil(nodes.length / columnCount);

  // 1. バーチャライザーの設定
  // eslint-disable-next-line react-hooks/incompatible-library -- メモ化すると正しく動作しないという警告を無効化。無視しても実害はない
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight, // 各行の高さ
    overscan: 1, // 画面外に何行予備を持っておくか
  });

  const handleToggleFavorite = async (node: MediaNode) => {
    try {
      await favoriteCtx.toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  return (
    <div ref={parentRef} className="w-full h-full">
      {/* 2. 合計の高さを持つコンテナ（スクロールバーの長さを決める） */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* 3. 現在見えている行だけをマッピング */}
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
            {/* 4. その行の中にあるカラム（セル）を描画 */}
            {Array.from({ length: columnCount }).map((_, colIndex) => {
              const index = virtualRow.index * columnCount + colIndex;
              const node = nodes[index];
              if (!node) return null;

              return (
                <div key={node.path} className="p-1">
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted cursor-pointer"
                    onClick={() => onOpen?.(node, index)}
                  >
                    {/* サムネイル */}
                    <MediaThumb
                      node={node}
                      className="w-full h-full object-cover"
                    />

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
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
