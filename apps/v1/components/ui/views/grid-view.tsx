"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useGridConfig } from "@/hooks/use-grid-config";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

export function GridView({
  allNodes,
  onOpen,
  onSelect,
}: {
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { columnCount, rowHeight } = useGridConfig(containerRef, {
    columnWidth: 200,
  });

  const rowCount = useMemo(
    () => Math.ceil(allNodes.length / columnCount),
    [columnCount, allNodes.length]
  );

  const getNodeIndex = useCallback(
    (rowIndex: number, colIndex: number) => {
      return rowIndex * columnCount + colIndex;
    },
    [columnCount]
  );

  const getNode = useCallback(
    (rowIndex: number, colIndex: number) => {
      const index = getNodeIndex(rowIndex, colIndex);
      if (index < 0 || index >= allNodes.length) return null;
      return allNodes[index];
    },
    [getNodeIndex, allNodes]
  );

  // 仮想グリッドの設定
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight, // 各行の高さ
    overscan: 1, // 画面外に何行予備を持っておくか
  });

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
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
              const node = getNode(row.index, colIndex);
              const globalIndex = row.index * columnCount + colIndex; // 全体でのインデックス
              return (
                node && (
                  <Cell
                    key={node.path}
                    node={node}
                    index={globalIndex}
                    allNodes={allNodes}
                    onOpen={onOpen}
                    onSelect={onSelect}
                  />
                )
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
  onOpen,
  onSelect,
}: {
  node: MediaNode;
  index: number;
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
}) {
  const isMobile = useIsMobile();
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  // お気に入り
  const { toggleFavorite, isFavorite } = useFavoritesContext();

  const favorite = useMemo(
    () => isFavorite(node.path),
    [isFavorite, node.path]
  );

  const handleToggleFavorite = () => {
    try {
      void toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // 選択
  const {
    isSelectionMode,
    isPathSelected,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectPath,
    addPaths,
    togglePath,
    replaceSelection,
    unselectPath,
    lastSelectedPath,
    setLastSelectedPath,
  } = usePathSelectionContext();

  const selected = useMemo(
    () => isPathSelected(node.path),
    [isPathSelected, node.path]
  );

  // チェックボックス
  const handleCheckedChange = (checked: boolean) => {
    if (!isMediaNode) return;

    enterSelectionMode();

    if (checked) {
      selectPath(node.path);
      onSelect?.();
    } else {
      unselectPath(node.path);

      // 現在の選択数が1件のみで、かつその1件を解除しようとしている場合
      if (selectedPaths.size === 1 && selectedPaths.has(node.path)) {
        exitSelectionMode();
      }
    }
  };

  // クリック
  const handleClick = (e: React.MouseEvent) => {
    if (!isMediaNode || isLongPressed || isMobile) return;

    e.preventDefault();

    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    // Shift
    if (isShift) {
      enterSelectionMode();

      // 前回の選択がある場合、範囲を選択
      if (lastSelectedPath !== null) {
        const lastSelectedIndex = allNodes.findIndex(
          (n) => n.path === lastSelectedPath
        );
        if (lastSelectedIndex < 0) return;
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const pathsInRange = allNodes
          .slice(start, end + 1)
          .filter((n) => isMedia(n.type))
          .map((n) => n.path);

        addPaths(pathsInRange); // 範囲を一括選択
        return;
      }

      selectPath(node.path);
      setLastSelectedPath(node.path);
      return;
    }

    // Ctrl
    if (isCmdOrCtrl) {
      enterSelectionMode();
      togglePath(node.path);
      setLastSelectedPath(node.path);
      return;
    }

    // 通常
    exitSelectionMode();
    replaceSelection(node.path);
    setLastSelectedPath(node.path);
    onSelect?.();
  };

  // タップ（モバイル用）
  const handleTap = (e: React.MouseEvent) => {
    if (isLongPressed || !isMobile) return;

    e.preventDefault();

    // 選択モード中
    if (isSelectionMode) {
      if (!isMediaNode) return;
      if (!selected) {
        selectPath(node.path);
      } else {
        unselectPath(node.path);

        // 現在の選択数が1件のみで、かつその1件を解除しようとしている場合
        if (selectedPaths.size === 1 && selectedPaths.has(node.path)) {
          exitSelectionMode();
        }
      }
      return;
    }

    // 通常
    onOpen?.(node);
  };

  // ダブルクリック
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isSelectionMode || isMobile) return;

    e.preventDefault();

    onOpen?.(node);
  };

  // 長押し
  const handleLongPress = () => {
    if (!isMediaNode) return;
    enterSelectionMode();
    replaceSelection(node.path);
    setLastSelectedPath(node.path);
  };

  const {
    start: startLongPress,
    stop: stopLongPress,
    isLongPressed,
  } = useLongPress(handleLongPress, 600);

  return (
    <div className="w-full h-full p-1">
      <div
        id={`media-item-${index}`}
        onMouseDown={startLongPress}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={stopLongPress}
        onTouchMove={stopLongPress} // スクロール時に長押しをキャンセル
        onClick={isMobile ? handleTap : handleClick}
        onDoubleClick={isMobile ? undefined : handleDoubleClick}
        className={cn(
          "relative group w-full h-full overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all",
          "select-none",
          selected
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
            isSelectionMode
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckedChange}
            onClick={(e) => e.stopPropagation()}
            disabled={!isMediaNode}
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
        {!isSelectionMode && isMediaNode && (
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
