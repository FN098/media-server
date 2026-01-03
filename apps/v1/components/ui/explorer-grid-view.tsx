"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { MarqueeText } from "@/components/ui/marquee-text";
import { MediaThumb } from "@/components/ui/media-thumb";
import { useGridView } from "@/hooks/use-grid-view";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { useCallback } from "react";
import { toast } from "sonner";

export function ExplorerGridView({
  allNodes,
  onOpen,
}: {
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
}) {
  const { containerRef, columnCount, getTotalHeight, getRows, getCellItem } =
    useGridView(allNodes);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* グリッド */}
      <div
        style={{
          height: `${getTotalHeight()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* 行 */}
        {getRows().map((row) => (
          <div
            key={row.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${row.size}px`,
              transform: `translateY(${row.start}px)`,
              display: "grid",
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            }}
          >
            {/* セル */}
            {Array.from({ length: columnCount }).map((_, colIndex) => {
              const node = getCellItem(row.index, colIndex);
              return (
                node && <Cell key={node.path} node={node} onOpen={onOpen} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  node,
  onOpen,
}: {
  node: MediaNode;
  onOpen?: (node: MediaNode) => void;
}) {
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  const { isSelectionMode, isSelected, toggleSelection } =
    usePathSelectionContext();

  const favorite = isFavorite(node.path);
  const selected = isSelected(node.path);
  const isMobile = useIsMobile();

  const handleSelectOrOpen = useCallback(() => {
    if (isSelectionMode) {
      toggleSelection(node.path);
    } else {
      onOpen?.(node);
    }
  }, [isSelectionMode, node, onOpen, toggleSelection]);

  const handleSelect = useCallback(() => {
    toggleSelection(node.path);
  }, [node, toggleSelection]);

  const handleToggleFavorite = useCallback(() => {
    try {
      void toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  }, [node.path, toggleFavorite]);

  return (
    <div className="w-full h-full p-1">
      <div
        className={cn(
          "relative group w-full h-full overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all",
          selected
            ? "ring-2 ring-primary border-transparent"
            : "hover:border-primary/50"
        )}
        onClick={handleSelectOrOpen}
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
            isSelectionMode || isMobile
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={handleSelect}
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
            active={favorite}
            onClick={handleToggleFavorite}
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

        {/* お気に入り数バッジ */}
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
