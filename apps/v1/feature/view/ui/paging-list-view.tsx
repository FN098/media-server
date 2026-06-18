"use client";

import { LocalDate } from "@/feature/datetime/ui/local-date";
import { useMediaNodeDndItem } from "@/feature/dnd/hooks/use-media-node-dnd-item";
import {
  MediaNodeDndProvider,
  useMediaNodeDndContext,
} from "@/feature/dnd/providers/media-node-dnd-provider";
import { FavoriteButton } from "@/feature/favorite/ui/favorite-button";
import { FavoriteRatingInput } from "@/feature/favorite/ui/favorite-rating-input";
import {
  LocaleProvider,
  useLocaleContext,
} from "@/feature/general/providers/locale-provider";
import { useMenuItemsContext } from "@/feature/menu-items/providers/menu-items-provider";
import { NodeContextMenu } from "@/feature/menu/ui/node-context-menu";
import { NodeDropdownMenu } from "@/feature/menu/ui/node-dropdown-menu";
import { useDetectMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { HoverPreviewPortal } from "@/feature/preview/ui/hover-preview-portal";
import { MediaThumbIcon } from "@/feature/thumbnail/ui/media-thumb-icons";
import { usePagingGridView } from "@/feature/view/hooks/use-paging-grid-view";
import {
  MediaNodeControlProvider,
  useMediaNodeControlContext,
} from "@/feature/view/providers/media-node-control-provider";
import { useMediaNodePagingViewContext } from "@/feature/view/providers/media-node-paging-view-provider";
import { AverageRatingBadge } from "@/feature/view/ui/average-rating-badge";
import { FavoriteRatingDisplay } from "@/feature/view/ui/favorite-rating-display";
import { FolderStatusBadge } from "@/feature/view/ui/folder-status-badge";
import { PagingControl } from "@/feature/view/ui/pagination-control";
import { SizeBar } from "@/feature/view/ui/size-bar";
import { formatBytes } from "@/lib/utils/bytes";
import { getExtension } from "@/lib/utils/filename";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";

// スマホ: Checkbox, Name, Rating, Actions
// タブレット: Checkbox, Name, Type, Size, Rating, Actions
// PC: Checkbox, Name, Type, Updated, Size, Last Viewed, Rating, Actions
const GRID_TEMPLATE = cn(
  "grid-cols-[40px_1fr_40px_80px]",
  "md:grid-cols-[40px_1fr_80px_180px_80px_80px]",
  "lg:grid-cols-[40px_1fr_80px_140px_180px_140px_80px_80px]"
);

export function PagingListView() {
  const {
    allNodes,
    onOpen,
    onSelectionChange,
    onDragEnd: onMoveNode,
  } = useMediaNodePagingViewContext();

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

  return (
    <MediaNodeDndProvider onDragEnd={onMoveNode}>
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col bg-background outline-none"
        tabIndex={0} // フォーカス可能にし、keydownイベントを拾う
        onKeyDown={handleKeyDown}
      >
        <HeaderRow />

        <LocaleProvider>
          <div ref={gridRef} className="flex-1 overflow-y-auto">
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
                <DataRow />
              </MediaNodeControlProvider>
            ))}
          </div>
        </LocaleProvider>

        <PagingControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <DragMediaNodeListOverlay />
    </MediaNodeDndProvider>
  );
}

function HeaderRow() {
  return (
    <div
      className={cn(
        "grid items-center h-10 border-b bg-muted/30 text-xs font-semibold text-muted-foreground z-10 min-w-0",
        GRID_TEMPLATE
      )}
    >
      <div className="flex justify-center">
        <Checkbox disabled className="opacity-50" />
      </div>
      <div>Name</div>
      <div className="hidden md:block">Type</div>
      <div className="hidden lg:block">Updated</div>
      <div className="hidden md:block">Size</div>
      <div className="hidden lg:block">Last Viewed</div>
      <div className="text-center">Rating</div>
      <div className="text-center">Actions</div>
    </div>
  );
}

function DataRow() {
  const { items: menuItems } = useMenuItemsContext();

  const {
    node,
    globalIndex,
    isMediaNode,
    isSelected,
    dropdownMenuOpen,
    contextMenuOpen,
    setContextMenuOpen,
    handleDropdownMenuOpenChange,
    longPressProps,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    toggleSelection,
    occupancyPercent,
    title,
  } = useMediaNodeControlContext();

  const { attributes, listeners, isDragging, isOver, setDndRef } =
    useMediaNodeDndItem({ node });

  const isMobile = useDetectMobileContext();

  const { locale } = useLocaleContext();

  return (
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
          ref={setDndRef}
          {...attributes}
          {...listeners}
          id={`media-item-${globalIndex}`}
          role="row"
          {...longPressProps}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          className={cn(
            "grid items-center h-12 border-b select-none cursor-pointer transition-colors text-sm",
            GRID_TEMPLATE,
            isSelected
              ? "bg-primary/10 hover:bg-primary/15"
              : "hover:bg-muted/50",
            isDragging && "opacity-20", // ドラッグ中の行を半透明に
            isOver &&
              "bg-emerald-500/20 hover:bg-emerald-500/25 border-y border-y-emerald-500 z-10" // フォルダ行の上にホバーした際のエフェクト
          )}
        >
          {/* Checkbox */}
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => {
                toggleSelection();
              }}
            />
          </div>

          {/* Icon + Name */}
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <MediaThumbIcon
              type={node.type}
              className="w-5 h-5 shrink-0 opacity-70"
            />
            <div className="flex flex-col min-w-0">
              <span className="truncate font-medium" title={title}>
                {title}
              </span>
              <span className="md:hidden text-[10px] text-muted-foreground truncate">
                {node.isDirectory
                  ? "Folder"
                  : `${getExtension(node.name)} • ${node.size ? formatBytes(node.size) : "-"}`}
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="hidden md:block text-muted-foreground text-xs uppercase">
            {node.isDirectory
              ? "Folder"
              : getExtension(node.name, { withDot: false })}
          </div>

          {/* Updated */}
          <div className="hidden lg:block text-muted-foreground text-xs tabular-nums">
            <LocalDate value={node.mtime} locale={locale} />
          </div>

          {/* Size */}
          <div className="hidden md:block min-w-0 overflow-hidden">
            <SizeBar
              pattern="A"
              size={node.size}
              fileCount={node.fileCount}
              occupancyPercent={occupancyPercent}
            />
          </div>

          {/* Last Viewed */}
          <div className="hidden lg:block text-muted-foreground text-xs tabular-nums">
            {node.isDirectory ? (
              <FolderStatusBadge
                date={node.lastViewedAt}
                className="border-none bg-transparent p-0"
              />
            ) : (
              "-"
            )}
          </div>

          {/* Rating */}
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <RatingCell />
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <NodeDropdownMenu
              node={node}
              menuItems={menuItems}
              open={dropdownMenuOpen}
              onOpenChange={handleDropdownMenuOpenChange}
            />
          </div>
        </div>
      </NodeContextMenu>
    </HoverPreviewPortal>
  );
}

function DragMediaNodeListOverlay() {
  const { activeNode } = useMediaNodeDndContext();
  if (!activeNode) return null;

  return createPortal(
    <DragOverlay dropAnimation={null}>
      {/* 行のような細長い半透明の枠をマウスに追従させる */}
      <div className="flex items-center gap-3 px-4 h-12 w-[320px] bg-background/90 backdrop-blur border-2 border-primary rounded-xl shadow-2xl pointer-events-none opacity-90 z-[9999]">
        <MediaThumbIcon
          type={activeNode.type}
          className="w-5 h-5 shrink-0 text-primary"
        />
        <span className="truncate font-medium text-sm text-foreground">
          {activeNode.title ?? activeNode.name}
        </span>
      </div>
    </DragOverlay>,
    document.body
  );
}

function RatingCell() {
  const { node, isFavorite, rating, toggleFavorite, updateFavorite } =
    useMediaNodeControlContext();

  if (node.isDirectory) {
    return (
      <>
        <FavoriteRatingDisplay
          value={node.averageRating ?? 0}
          className="hidden md:flex"
        />
        <AverageRatingBadge
          rating={node.averageRating ?? 0}
          className="flex md:hidden"
        />
      </>
    );
  }

  return (
    <>
      <FavoriteRatingInput
        value={rating}
        onChange={(rating) => void updateFavorite(node.path, rating)}
        className="hidden md:flex"
      />
      <FavoriteButton
        rating={rating}
        isFavorite={isFavorite}
        onClick={toggleFavorite}
        className="flex md:hidden"
      />
    </>
  );
}
