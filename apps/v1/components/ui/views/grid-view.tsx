"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useGridConfig } from "@/hooks/use-grid-config";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MoreVertical, Move, Pencil } from "lucide-react";
import React, { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

export function GridView({
  allNodes,
  onOpen,
  onSelect,
  onRename,
  onMove,
}: {
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // コンテナの幅に合わせてグリッドの列数と行の高さを計算
  const { columnCount, rowHeight } = useGridConfig(containerRef, {
    columnWidth: 200,
  });

  const rowCount = useMemo(
    // columnCount は 1 以上なので 0 除算の心配はない
    () => Math.ceil(allNodes.length / columnCount),
    [columnCount, allNodes.length]
  );

  const getNode = useCallback(
    (rowIndex: number, colIndex: number) => {
      const index = rowIndex * columnCount + colIndex;
      if (index < 0 || index >= allNodes.length) return null;
      return allNodes[index];
    },
    [columnCount, allNodes]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  const isMobile = useIsMobile();

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col"
      style={{ contain: "layout" }}
    >
      {/* グリッド */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* 行 */}
        {rowVirtualizer.getVirtualItems().map((row) => (
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
              const globalIndex = row.index * columnCount + colIndex; // 全体でのインデックス
              const node = getNode(row.index, colIndex);

              if (!node) return <div key={`empty-${globalIndex}`} />;

              return (
                <Cell
                  key={node.path}
                  node={node}
                  index={globalIndex}
                  allNodes={allNodes}
                  isMobile={isMobile}
                  onOpen={onOpen}
                  onSelect={onSelect}
                  onRename={onRename}
                  onMove={onMove}
                />
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
  index,
  allNodes,
  isMobile,
  onOpen,
  onSelect,
  onRename,
  onMove,
}: {
  node: MediaNode;
  index: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
}) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  /* ================= Favorite ================= */

  const favCtx = useFavoritesContext();
  const isFavorite = favCtx.isFavorite(node.path);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      void favCtx.toggleFavorite(node.path);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  /* ================= Selection ================= */

  const selectCtx = usePathSelectionContext();
  const isSelected = selectCtx.isSelectedPath(node.path);

  /* ================= Long Press ================= */

  const handleLongPress = () => {
    selectCtx.enterSelectionMode();
    selectCtx.replaceSelection(node.path);
    selectCtx.setLastSelectedPath(node.path);
    onSelect?.();
  };

  const { start, stop, isLongPressed } = useLongPress(handleLongPress, 600);

  /* ================= Click ================= */

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressed || isMobile) return;

    e.preventDefault();

    if (e.shiftKey && e.ctrlKey && selectCtx.lastSelectedPath !== null) {
      selectCtx.enterSelectionMode();
      const lastIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.lastSelectedPath
      );
      if (lastIdx !== -1) {
        const start = Math.min(lastIdx, index);
        const end = Math.max(lastIdx, index);
        const paths = allNodes
          .slice(start, end + 1)
          .filter((n) => isMedia(n.type))
          .map((n) => n.path);
        selectCtx.deletePaths(paths);
        onSelect?.();
        return;
      }
    }

    if (e.shiftKey && selectCtx.lastSelectedPath !== null) {
      selectCtx.enterSelectionMode();
      const lastIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.lastSelectedPath
      );
      if (lastIdx !== -1) {
        const start = Math.min(lastIdx, index);
        const end = Math.max(lastIdx, index);
        const paths = allNodes
          .slice(start, end + 1)
          .filter((n) => isMedia(n.type))
          .map((n) => n.path);
        selectCtx.addPaths(paths);
        onSelect?.();
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      selectCtx.enterSelectionMode();
      selectCtx.togglePath(node.path);
      selectCtx.setLastSelectedPath(node.path);
      onSelect?.();
      return;
    }

    selectCtx.exitSelectionMode();
    selectCtx.replaceSelection(node.path);
    selectCtx.setLastSelectedPath(node.path);
    onSelect?.();
  };

  const handleTap = (e: React.MouseEvent) => {
    if (isLongPressed || !isMobile) return;

    e.preventDefault();

    if (selectCtx.isSelectionMode) {
      if (!isSelected) {
        selectCtx.selectPath(node.path);
      } else {
        selectCtx.unselectPath(node.path);

        // 現在の選択数が1件のみで、かつその1件を解除しようとしている場合
        if (
          selectCtx.selectedPaths.size === 1 &&
          selectCtx.selectedPaths.has(node.path)
        ) {
          selectCtx.exitSelectionMode();
        }
      }
      onSelect?.();
      return;
    }

    onOpen?.(node);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (selectCtx.isSelectionMode || isMobile) return;

    e.preventDefault();

    onOpen?.(node);
  };

  return (
    <div className="w-full h-full p-1">
      <HoverPreviewPortal node={node} enabled={isMediaNode && !isMobile}>
        <div
          id={`media-item-${index}`} // 自動スクロールで使う
          onMouseDown={start}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchEnd={stop}
          onTouchMove={stop}
          onClick={isMobile ? handleTap : handleClick}
          onDoubleClick={isMobile ? undefined : handleDoubleClick}
          className={cn(
            "select-none relative group w-full h-full overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all",
            isSelected
              ? "ring-2 ring-primary border-transparent"
              : "hover:border-primary/50"
          )}
        >
          {/* サムネイル */}
          <MediaThumb
            node={node}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* 選択チェックボックス */}
          <div
            className={cn(
              "absolute top-2 left-2 transition-opacity",
              selectCtx.isSelectionMode
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handleClick}
          >
            <Checkbox checked={isSelected} />
          </div>

          {/* テキストオーバーレイ */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
            <MarqueeText
              text={node.title ?? node.name}
              className="text-center text-[10px] leading-tight text-white"
            />
          </div>

          {/* お気に入りボタン */}
          {!selectCtx.isSelectionMode && isMediaNode && (
            <FavoriteButton
              variant="grid"
              active={isFavorite}
              onClick={handleToggleFavorite}
              className="absolute top-1 right-1"
            />
          )}

          {/* ステータスバッジ */}
          {node.isDirectory && (
            <FolderStatusBadge
              date={node.lastViewedAt}
              className="absolute bottom-8 right-1"
            />
          )}

          {/* お気に入り数バッジ */}
          {node.isDirectory && (
            <FavoriteCountBadge
              count={node.favoriteCount ?? 0}
              className="absolute top-1 right-1"
            />
          )}

          {/* 3点リーダーメニュー */}
          {!selectCtx.isSelectionMode && (
            <div
              className={cn(
                "absolute bottom-10 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                isMobile && "opacity-100"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-primary/20 hover:bg-primary/40 text-white hover:text-white rounded-full"
                    onClick={(e) => e.stopPropagation()} // セルのクリックイベントを阻止
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onRename && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(node);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      名前の変更
                    </DropdownMenuItem>
                  )}
                  {onMove && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(node);
                      }}
                    >
                      <Move className="mr-2 h-4 w-4" />
                      移動
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </HoverPreviewPortal>
    </div>
  );
}
