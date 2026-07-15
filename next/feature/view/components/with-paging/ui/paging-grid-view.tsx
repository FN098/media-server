"use client";

import { useMediaNodeDndItem } from "@/feature/dnd/hooks/use-media-node-dnd-item";
import {
  MediaNodeDndProvider,
  useMediaNodeDndContext,
} from "@/feature/dnd/providers/media-node-dnd-provider";
import { FavoriteButton } from "@/feature/favorite/ui/favorite-button";
import { useCanHoverContext } from "@/feature/general/providers/can-hover-provider";
import { useMenuItemsContext } from "@/feature/menu-items/providers/menu-items-provider";
import { NodeContextMenu } from "@/feature/menu/ui/node-context-menu";
import { NodeDropdownMenu } from "@/feature/menu/ui/node-dropdown-menu";
import { useDetectMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { HoverPreviewPortal } from "@/feature/preview/ui/hover-preview-portal";
import { usePathSelectionContext } from "@/feature/selection/providers/path-selection-provider";
import { MarqueeText } from "@/feature/text/ui/marquee-text";
import { MediaThumb } from "@/feature/thumbnail/ui/media-thumb";
import { usePagingGridView } from "@/feature/view/components/with-paging/hooks/use-paging-grid-view";
import { useMediaNodePagingViewContext } from "@/feature/view/components/with-paging/providers/media-node-paging-view-provider";
import { AverageRatingBadge } from "@/feature/view/components/with-paging/ui/average-rating-badge";
import { FolderStatusBadge } from "@/feature/view/components/with-paging/ui/folder-status-badge";
import { PagingControl } from "@/feature/view/components/with-paging/ui/pagination-control";
import {
  MediaNodeControlProvider,
  useMediaNodeControlContext,
} from "@/feature/view/providers/media-node-control-provider";
import { formatBytes } from "@/lib/utils/bytes";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { DragOverlay } from "@dnd-kit/core";

export function PagingGridView() {
  const { allNodes, onOpen, onSelectionChange, onDragEnd } =
    useMediaNodePagingViewContext();

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
  } = usePagingGridView();

  const isMobile = useDetectMobileContext();

  return (
    <MediaNodeDndProvider onDragEnd={onDragEnd}>
      <div
        ref={containerRef}
        className="flex flex-col relative outline-none"
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
            <MediaNodeControlProvider
              key={node.path}
              node={node}
              globalIndex={(currentPage - 1) * pageSize + index}
              allNodes={allNodes}
              totalSize={totalSize}
              onOpen={onOpen}
              onSelectionChange={onSelectionChange}
            >
              <Cell />
            </MediaNodeControlProvider>
          ))}
        </div>

        <PagingControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="shrink-0"
        />
      </div>

      <DragCellOverlay />
    </MediaNodeDndProvider>
  );
}

function Cell() {
  const { onThumbError } = useMediaNodePagingViewContext();
  const { items: menuItems } = useMenuItemsContext();

  const {
    node,
    globalIndex,
    isMediaNode,
    isFavorite,
    rating,
    isSelected,
    dropdownMenuOpen,
    contextMenuOpen,
    setContextMenuOpen,
    handleDropdownMenuOpenChange,
    longPressProps,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    toggleFavorite,
    occupancyPercent,
    title,
  } = useMediaNodeControlContext();

  const { isSelectionMode } = usePathSelectionContext();

  const { attributes, listeners, isDragging, isOver, setDndRef } =
    useMediaNodeDndItem({ node });

  const isMobile = useDetectMobileContext();
  const canHover = useCanHoverContext();

  return (
    <div
      ref={setDndRef}
      {...attributes}
      {...listeners} // これにより要素全体がドラッグハンドルになります
      className={cn(
        "relative group aspect-[3/4] sm:aspect-[4/5] transition-shadowTouch",
        isDragging && "opacity-40", // ドラッグ中の半透明化
        isOver && "ring-4 ring-emerald-500 rounded-xl" // フォルダの上にホバーした際のエフェクト
      )}
    >
      <div
        className={cn(
          "w-full h-full transition-opacity",
          isDragging && "opacity-0"
        )}
      >
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
    </div>
  );
}

function DragCellOverlay() {
  const { activeNode } = useMediaNodeDndContext();
  if (!activeNode) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <div className="w-[180px] aspect-[4/5] opacity-80 pointer-events-none border border-primary rounded-xl overflow-hidden shadow-2xl scale-95 origin-center">
        <MediaThumb
          node={activeNode}
          className="w-full h-full object-cover"
          showIcon
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-[11px] font-medium text-white text-center truncate">
            {activeNode.title ?? activeNode.name}
          </p>
        </div>
      </div>
    </DragOverlay>
  );
}
