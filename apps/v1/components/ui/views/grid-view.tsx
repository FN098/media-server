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

  // コンテナの幅に合わせてグリッドの列数と行の高さを計算
  const { columnCount: rawColumnCount, rowHeight } = useGridConfig(
    containerRef,
    {
      columnWidth: 200,
    }
  );

  // 0除算防止
  const columnCount = Math.max(1, rawColumnCount);

  const rowCount = useMemo(
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

  const { toggleFavorite, isFavorite } = useFavoritesContext();
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

  // actionsを完全にメモ化
  const actions = useMemo(
    () => ({
      toggleFavorite,
      enterSelectionMode,
      exitSelectionMode,
      selectPath,
      unselectPath,
      addPaths,
      togglePath,
      replaceSelection,
      setLastSelectedPath,
    }),
    [
      toggleFavorite,
      enterSelectionMode,
      exitSelectionMode,
      selectPath,
      unselectPath,
      addPaths,
      togglePath,
      replaceSelection,
      setLastSelectedPath,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto custom-scrollbar"
      style={{ contain: "layout" }} // ブラウザ最適化用
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
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
            {Array.from({ length: columnCount }).map((_, colIndex) => {
              const globalIndex = row.index * columnCount + colIndex;
              const node = getNode(row.index, colIndex);

              if (!node) return <div key={`empty-${globalIndex}`} />;

              return (
                <MemorizedCell
                  key={node.path}
                  node={node}
                  index={globalIndex}
                  allNodes={allNodes}
                  isSelected={isPathSelected(node.path)}
                  isFavorite={isFavorite(node.path)}
                  isSelectionMode={isSelectionMode}
                  selectedCount={selectedPaths.size}
                  lastSelectedPath={lastSelectedPath}
                  onOpen={onOpen}
                  onSelect={onSelect}
                  actions={actions}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// 型定義
type SelectionActions = {
  toggleFavorite: (path: string) => Promise<boolean | undefined>;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  selectPath: (path: string) => void;
  unselectPath: (path: string) => void;
  addPaths: (paths: string[]) => void;
  togglePath: (path: string) => void;
  replaceSelection: (path: string) => void;
  setLastSelectedPath: (path: string | null) => void;
};

interface CellProps {
  node: MediaNode;
  index: number;
  allNodes: MediaNode[];
  isSelected: boolean;
  isFavorite: boolean;
  isSelectionMode: boolean;
  selectedCount: number;
  lastSelectedPath: string | null;
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
  actions: SelectionActions;
}

const MemorizedCell = React.memo(
  function Cell({
    node,
    index,
    allNodes,
    isSelected,
    isFavorite,
    isSelectionMode,
    selectedCount,
    lastSelectedPath,
    onOpen,
    onSelect,
    actions,
  }: CellProps) {
    const isMobile = useIsMobile();
    const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

    const handleToggleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        void actions.toggleFavorite(node.path);
      } catch (err) {
        console.error(err);
        toast.error("お気に入りの更新に失敗しました");
      }
    };

    const handleCheckedChange = (checked: boolean) => {
      if (!isMediaNode) return;
      actions.enterSelectionMode();
      if (checked) {
        actions.selectPath(node.path);
        onSelect?.();
      } else {
        actions.unselectPath(node.path);
        if (selectedCount === 1 && isSelected) {
          actions.exitSelectionMode();
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isMediaNode || isLongPressed || isMobile) return;
      e.preventDefault();

      if (e.shiftKey && lastSelectedPath !== null) {
        actions.enterSelectionMode();
        const lastIdx = allNodes.findIndex((n) => n.path === lastSelectedPath);
        if (lastIdx !== -1) {
          const start = Math.min(lastIdx, index);
          const end = Math.max(lastIdx, index);
          const paths = allNodes
            .slice(start, end + 1)
            .filter((n) => isMedia(n.type))
            .map((n) => n.path);
          actions.addPaths(paths);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        actions.enterSelectionMode();
        actions.togglePath(node.path);
      } else {
        actions.exitSelectionMode();
        actions.replaceSelection(node.path);
        onSelect?.();
      }
      actions.setLastSelectedPath(node.path);
    };

    const handleTap = (e: React.MouseEvent) => {
      if (isLongPressed || !isMobile) return;
      e.preventDefault();

      if (isSelectionMode) {
        if (!isMediaNode) return;
        if (!isSelected) {
          actions.selectPath(node.path);
        } else {
          actions.unselectPath(node.path);
          if (selectedCount === 1 && isSelected) {
            actions.exitSelectionMode();
          }
        }
        return;
      }
      onOpen?.(node);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (isSelectionMode || isMobile) return;
      e.preventDefault();
      onOpen?.(node);
    };

    const handleLongPress = () => {
      if (!isMediaNode) return;
      actions.enterSelectionMode();
      actions.replaceSelection(node.path);
      actions.setLastSelectedPath(node.path);
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
          onTouchMove={stopLongPress}
          onClick={isMobile ? handleTap : handleClick}
          onDoubleClick={isMobile ? undefined : handleDoubleClick}
          className={cn(
            "relative group w-full h-full overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all select-none",
            isSelected
              ? "ring-2 ring-primary border-transparent"
              : "hover:border-primary/50"
          )}
        >
          <MediaThumb
            node={node}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          <div
            className={cn(
              "absolute top-2 left-2 transition-opacity",
              isSelectionMode
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckedChange}
              onClick={(e) => e.stopPropagation()}
              disabled={!isMediaNode}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
            <MarqueeText
              text={node.title ?? node.name}
              className="text-center text-[10px] leading-tight text-white"
            />
          </div>

          {!isSelectionMode && isMediaNode && (
            <FavoriteButton
              variant="grid"
              active={isFavorite}
              onClick={handleToggleFavorite}
              className="absolute top-1 right-1"
            />
          )}

          {node.isDirectory && (
            <>
              <FolderStatusBadge
                date={node.lastViewedAt}
                className="absolute top-1 right-1"
              />
              <FavoriteCountBadge
                count={node.favoriteCount ?? 0}
                className="absolute top-1 left-1"
              />
            </>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.node === next.node && // オブジェクト自体が同じか
      prev.isSelected === next.isSelected &&
      prev.isFavorite === next.isFavorite &&
      prev.isSelectionMode === next.isSelectionMode &&
      prev.selectedCount === next.selectedCount &&
      prev.lastSelectedPath === next.lastSelectedPath &&
      prev.actions === next.actions // actionsのメモ化が効いている前提
    );
  }
);
