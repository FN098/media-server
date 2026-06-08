"use client";

import { AverageRatingBadge } from "@/components/ui/badges/average-rating-badge";
import { FavoriteRatingDisplay } from "@/components/ui/badges/favorite-rating-display";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { SizeBar } from "@/components/ui/bars/size-bar";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { NodeContextMenu } from "@/components/ui/context-menus/node-context-menu";
import { LocalDate } from "@/components/ui/dates/local-date";
import { NodeDropdownMenu } from "@/components/ui/dropdown-menus/node-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb-icons";
import { useGridCell } from "@/hooks/view/use-grid-cell";
import { usePagingGridView } from "@/hooks/view/use-paging-grid-view";
import { MediaNode } from "@/lib/media/types";
import { formatBytes } from "@/lib/utils/bytes";
import { getExtension } from "@/lib/utils/filename";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { LocaleProvider, useLocaleContext } from "@/providers/locale-provider";
import { useMenuItemsContext } from "@/providers/menu-items-provider";
import { useDetectMobileContext } from "@/providers/mobile-provider";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { useMemo } from "react";

// スマホ: Checkbox, Name, Rating, Actions
// タブレット: Checkbox, Name, Type, Size, Rating, Actions
// PC: Checkbox, Name, Type, Updated, Size, Last Viewed, Rating, Actions
const GRID_TEMPLATE = cn(
  "grid-cols-[40px_1fr_40px_80px]",
  "md:grid-cols-[40px_1fr_80px_180px_80px_80px]",
  "lg:grid-cols-[40px_1fr_80px_140px_180px_140px_80px_80px]"
);

interface PagingListViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

export function PagingListView(props: PagingListViewProps) {
  const isMobile = useDetectMobileContext();

  const {
    containerRef,
    gridRef, // ListViewでは全行を包む親要素（仮想的なグリッド）にアタッチ
    currentNodes,
    totalSize,
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    handleKeyDown,
  } = usePagingGridView(props);

  const { allNodes, onOpen, onSelectionChange, onThumbError } = props;

  return (
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
            <DataRow
              key={node.path}
              node={node}
              globalIndex={(currentPage - 1) * pageSize + index}
              allNodes={allNodes}
              isMobile={isMobile}
              totalSize={totalSize}
              onOpen={onOpen}
              onSelectionChange={onSelectionChange}
              onThumbError={onThumbError}
            />
          ))}
        </div>
      </LocaleProvider>

      <PagingControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
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

interface DataRowProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  totalSize: number;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

function DataRow(props: DataRowProps) {
  const { locale } = useLocaleContext();
  const { items: menuItems } = useMenuItemsContext();
  const { updateFavorite } = useFavoritesControlContext();

  // Cell用ロジックフックの再利用
  const {
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
    toggleSelection,
  } = useGridCell(props);

  const { node, globalIndex, isMobile, totalSize } = props;

  // 占有率計算
  const occupancyPercent = useMemo(() => {
    if (!node.size || totalSize === 0) return 0;
    return (node.size / totalSize) * 100;
  }, [node.size, totalSize]);

  const title = node.title ?? node.name;

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
              : "hover:bg-muted/50"
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
            <RatingCell
              node={node}
              rating={rating}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              updateFavorite={(path, rating) =>
                void updateFavorite(path, rating)
              }
            />
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

interface RatingCellProps {
  node: MediaNode;
  rating: number | null;
  isFavorite: boolean;
  toggleFavorite: () => void;
  updateFavorite: (path: string, rating: number | null) => void;
}

function RatingCell({
  node,
  rating,
  isFavorite,
  toggleFavorite,
  updateFavorite,
}: RatingCellProps) {
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
        onChange={(rating) => updateFavorite(node.path, rating)}
        className="hidden md:flex"
      />
      <FavoriteButton
        variant="default"
        rating={rating}
        isFavorite={isFavorite}
        onClick={toggleFavorite}
        className="flex md:hidden"
      />
    </>
  );
}
