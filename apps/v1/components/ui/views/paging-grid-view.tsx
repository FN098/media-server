"use client";

import { AverageRatingBadge } from "@/components/ui/badges/average-rating-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { NodeContextMenu } from "@/components/ui/context-menus/node-context-menu";
import { NodeDropdownMenu } from "@/components/ui/dropdown-menus/node-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useGridCell } from "@/hooks/view/use-grid-cell";
import { usePagingGridView } from "@/hooks/view/use-paging-grid-view";
import { MediaNode } from "@/lib/media/types";
import { formatBytes } from "@/lib/utils/bytes";
import { useCanHoverContext } from "@/providers/can-hover-provider";
import { useMenuItemsContext } from "@/providers/menu-items-provider";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { useMemo } from "react";

interface PagingGridViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

export function PagingGridView(props: PagingGridViewProps) {
  const { onOpen, onSelectionChange, onThumbError } = props;

  const isMobile = useIsMobile();
  const canHover = useCanHoverContext();

  const {
    containerRef,
    gridRef,
    currentNodes,
    totalSize,
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    handleKeyDown,
  } = usePagingGridView(props);

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col relative outline-none"
      tabIndex={0} // フォーカス可能にし、keydownイベントを拾う
      onKeyDown={handleKeyDown}
    >
      <div
        ref={gridRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 grid gap-4 auto-rows-max",
          isMobile
            ? "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]"
            : "grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
        )}
      >
        {currentNodes.map((node, index) => (
          <Cell
            key={node.path}
            node={node}
            globalIndex={(currentPage - 1) * pageSize + index}
            allNodes={props.allNodes}
            isMobile={isMobile}
            canHover={canHover}
            totalSize={totalSize}
            onOpen={onOpen}
            onSelectionChange={onSelectionChange}
            onThumbError={onThumbError}
          />
        ))}
      </div>

      <PagingControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="shrink-0"
      />
    </div>
  );
}

interface CellProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  canHover: boolean;
  totalSize: number;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

function Cell(props: CellProps) {
  const { items: menuItems } = useMenuItemsContext();

  const {
    isMediaNode,
    isFavorite,
    rating,
    isSelected,
    isSelectionMode,
    dropdownMenuOpen,
    contextMenuOpen,
    setContextMenuOpen,
    handleDropdownMenuOpenChange,
    longPressProps,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    toggleFavorite,
  } = useGridCell(props);

  const { node, globalIndex, isMobile, canHover, totalSize, onThumbError } =
    props;

  // 合計サイズに対するこのノードの占有率（%）
  const occupancyPercent = useMemo(() => {
    if (!node.size || totalSize === 0) return 0;
    return (node.size / totalSize) * 100;
  }, [node.size, totalSize]);

  const title = node.title ?? node.name;

  return (
    <div className="relative group aspect-[3/4] sm:aspect-[4/5]">
      <HoverPreviewPortal
        key={node.id}
        node={node}
        enabled={
          isMediaNode && !isMobile && !dropdownMenuOpen && !contextMenuOpen
        }
      >
        <NodeContextMenu
          node={node}
          menuItems={menuItems}
          onOpenChange={setContextMenuOpen}
          disabled={isMobile}
        >
          <div
            id={`media-item-${globalIndex}`}
            {...longPressProps}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className={cn(
              "relative w-full h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 select-none cursor-pointer",
              isSelected
                ? "ring-2 ring-primary border-transparent shadow-md scale-[0.98]"
                : "hover:border-primary/50 hover:shadow-sm"
            )}
          >
            <MediaThumb
              node={node}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              onError={() => onThumbError?.(node)}
              showIcon
            />

            {/* Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />

            {/* 選択 UI */}
            <div
              className={cn(
                "absolute top-3 left-3 z-10 transition-opacity duration-200",
                isSelectionMode
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                className="h-5 w-5 border-white/50 data-[state=checked]:bg-primary"
              />
            </div>

            {/* タイトル */}
            <div
              className="absolute bottom-0 left-0 right-0 p-2 z-10"
              title={title}
            >
              <MarqueeText className="text-[11px] font-medium text-white text-center">
                {title}
              </MarqueeText>
            </div>

            {/* アクションボタン */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
              {!isSelectionMode && isMediaNode && (
                <FavoriteButton
                  size="small"
                  rating={rating}
                  isFavorite={isFavorite}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                />
              )}

              {!isSelectionMode && (
                <div
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    !canHover && "opacity-100"
                  )}
                >
                  <NodeDropdownMenu
                    node={node}
                    menuItems={menuItems}
                    open={dropdownMenuOpen}
                    onOpenChange={handleDropdownMenuOpenChange}
                  />
                </div>
              )}
            </div>

            {/* バッジ情報 */}
            <div className="absolute flex flex-col bottom-8 right-2 gap-1 items-end">
              {node.isDirectory && node.averageRating && (
                <AverageRatingBadge rating={node.averageRating} />
              )}
              {node.isDirectory && (
                <FolderStatusBadge date={node.lastViewedAt} />
              )}
            </div>

            {/* サイズ / ファイル数 / 占有率 */}
            <div className="absolute bottom-8 left-2 flex flex-col gap-1 items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {node.fileCount != null && (
                <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {node.fileCount} files
                </span>
              )}

              {node.size != null && (
                <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {formatBytes(node.size)}
                </span>
              )}

              {occupancyPercent > 0 && (
                <span className="text-[10px] text-white/70 bg-black/30 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {occupancyPercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </NodeContextMenu>
      </HoverPreviewPortal>
    </div>
  );
}
