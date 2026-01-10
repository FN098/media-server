"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { PagingControl } from "@/components/ui/paginations/paging-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
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
import { FolderInput, MoreVertical, Pencil, Tag } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface PagingGridViewProps {
  allNodes: MediaNode[];
  pageSize?: number;
  onOpen?: (node: MediaNode) => void;
  onOpenFolder?: (path: string, at?: IndexLike) => void;
  onSelect?: () => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
}

export function PagingGridView({
  allNodes,
  pageSize = 60,
  onOpen,
  onOpenFolder,
  onSelect,
  onRename,
  onMove,
  onEditTags,
}: PagingGridViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNodes.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  const totalPages = Math.ceil(allNodes.length / pageSize);
  const currentNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allNodes.slice(start, start + pageSize);
  }, [allNodes, currentPage, pageSize]);

  const isMobile = useIsMobile();

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 auto-rows-max"
      >
        {currentNodes.map((node, index) => (
          <Cell
            key={node.path}
            node={node}
            globalIndex={(currentPage - 1) * pageSize + index}
            allNodes={allNodes}
            isMobile={isMobile}
            onOpen={onOpen}
            onOpenFolder={onOpenFolder}
            onSelect={onSelect}
            onRename={onRename}
            onMove={onMove}
            onEditTags={onEditTags}
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

/* -------------------------------------------------------------------------- */
/* Sub Components (Cell, ActionMenu)                                          */
/* -------------------------------------------------------------------------- */

interface CellProps extends Omit<PagingGridViewProps, "allNodes"> {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
}

function Cell({
  node,
  globalIndex,
  allNodes,
  isMobile,
  onOpen,
  onOpenFolder,
  onSelect,
  onRename,
  onMove,
  onEditTags,
}: CellProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);
  const favCtx = useFavoritesContext();
  const selectCtx = usePathSelectionContext();

  const isFavorite = favCtx.isFavorite(node.path);
  const isSelected = selectCtx.isSelectedPath(node.path);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        void favCtx.toggleFavorite(node.path);
      } catch {
        toast.error("お気に入りの更新に失敗しました");
      }
    },
    [favCtx, node.path]
  );

  const handleLongPress = useCallback(() => {
    selectCtx.enterSelectionMode();
    selectCtx.replaceSelection(node.path);
    selectCtx.setLastSelectedPath(node.path);
    onSelect?.();
  }, [selectCtx, node.path, onSelect]);

  const { start, stop, isLongPressed } = useLongPress(handleLongPress, 600);

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressed || isMobile) return;
    e.preventDefault();

    // 範囲選択ロジック
    if (e.shiftKey && selectCtx.lastSelectedPath !== null) {
      selectCtx.enterSelectionMode();
      const lastIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.lastSelectedPath
      );
      if (lastIdx !== -1) {
        const startIdx = Math.min(lastIdx, globalIndex);
        const endIdx = Math.max(lastIdx, globalIndex);
        const paths = allNodes
          .slice(startIdx, endIdx + 1)
          .filter((n) => isMedia(n.type))
          .map((n) => n.path);

        if (e.ctrlKey || e.metaKey) {
          selectCtx.deletePaths(paths);
        } else {
          selectCtx.addPaths(paths);
        }
        onSelect?.();
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      selectCtx.enterSelectionMode();
      selectCtx.togglePath(node.path);
    } else {
      selectCtx.exitSelectionMode();
      selectCtx.replaceSelection(node.path);
    }
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

  return (
    <div className="relative group aspect-[3/4] sm:aspect-[4/5]">
      <HoverPreviewPortal node={node} enabled={isMediaNode && !isMobile}>
        <div
          onMouseDown={start}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchEnd={stop}
          onClick={isMobile ? handleTap : handleClick}
          onDoubleClick={!isMobile ? () => onOpen?.(node) : undefined}
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
          />

          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />

          {/* Selection UI */}
          <div
            className={cn(
              "absolute top-3 left-3 z-10 transition-opacity duration-200",
              selectCtx.isSelectionMode
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

          {/* Info Overlays */}
          <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
            <MarqueeText
              text={node.title ?? node.name}
              className="text-[11px] font-medium text-white text-center"
            />
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {!selectCtx.isSelectionMode && isMediaNode && (
              <FavoriteButton
                variant="grid"
                active={isFavorite}
                onClick={handleToggleFavorite}
                className="h-8 w-8 bg-black/20 backdrop-blur-md hover:bg-black/40 border-none text-white"
              />
            )}

            {!selectCtx.isSelectionMode && (
              <div
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  isMobile && "opacity-100"
                )}
              >
                <ActionMenu
                  node={node}
                  onRename={onRename}
                  onMove={onMove}
                  onEditTags={onEditTags}
                  onOpenFolder={onOpenFolder}
                />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute bottom-8 right-2 flex gap-1 items-end">
            {node.isDirectory && <FolderStatusBadge date={node.lastViewedAt} />}
            {node.isDirectory && !!node.favoriteCount && (
              <FavoriteCountBadge count={node.favoriteCount} />
            )}
          </div>
        </div>
      </HoverPreviewPortal>
    </div>
  );
}

interface ActionMenuProps {
  node: MediaNode;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
  onOpenFolder?: (path: string) => void;
}

function ActionMenu({
  node,
  onRename,
  onMove,
  onEditTags,
  onOpenFolder,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 bg-black/20 backdrop-blur-md hover:bg-black/40 border-none text-white rounded-full"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onOpenFolder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(getParentDirPath(node.path));
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> フォルダを開く
          </DropdownMenuItem>
        )}
        {onRename && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 移動
          </DropdownMenuItem>
        )}
        {onEditTags && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
