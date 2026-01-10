"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { LocalDate } from "@/components/ui/dates/local-date";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/formatter";
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
import {
  ChevronLeft,
  ChevronRight,
  FolderInput,
  MoreVertical,
  Pencil,
  Tag,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface PagingListViewProps {
  allNodes: MediaNode[];
  pageSize?: number;
  onOpen?: (node: MediaNode) => void;
  onOpenFolder?: (path: string, at?: IndexLike) => void;
  onSelect?: () => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
}

// カラム定義を一箇所に集約（ヘッダーとデータ行で共通）
const GRID_TEMPLATE =
  "grid-cols-[40px_1fr_50px_50px] md:grid-cols-[40px_1fr_80px_140px_100px_140px_80px_80px]";

export function PagingListView({
  allNodes,
  pageSize = 100, // リストは100件程度がスクロールしやすく丁度いい
  onOpen,
  onOpenFolder,
  onSelect,
  onRename,
  onMove,
  onEditTags,
}: PagingListViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNodes.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  pageSize = Math.min(Math.max(1, pageSize), allNodes.length); // 正規化

  const totalPages = Math.ceil(allNodes.length / pageSize);
  const currentNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allNodes.slice(start, start + pageSize);
  }, [allNodes, currentPage, pageSize]);

  const isMobile = useIsMobile();

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col overflow-y-auto"
    >
      <HeaderRow />

      <div className="flex-1">
        {currentNodes.map((node, index) => (
          <DataRow
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

      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-2 flex items-center justify-center gap-6 z-20 shadow-md">
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            <span className="text-primary">{currentPage}</span> / {totalPages}
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function HeaderRow() {
  return (
    <div
      className={cn(
        "grid items-center h-10 border-b bg-muted/30 text-xs font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur",
        GRID_TEMPLATE
      )}
    >
      <div className="flex justify-center">
        <Checkbox disabled className="opacity-50" />
      </div>
      <div>Name</div>
      {/* 2. デスクトップのみ表示するカラムに md:block / hidden を追加 */}
      <div className="hidden md:block">Type</div>
      <div className="hidden md:block">Updated</div>
      <div className="hidden md:block">Size</div>
      <div className="hidden md:block">Last Viewed</div>
      <div className="text-center">Favorite</div>
      <div className="text-center">Actions</div>
    </div>
  );
}

interface DataRowProps extends Omit<PagingListViewProps, "allNodes"> {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  onEditTags?: (node: MediaNode) => void;
}

function DataRow({
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
}: DataRowProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);
  const favCtx = useFavoritesContext();
  const selectCtx = usePathSelectionContext();

  const isFavorite = favCtx.isFavorite(node.path);
  const isSelected = selectCtx.isSelectedPath(node.path);

  const toggleFavorite = useCallback(
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

    if (e.shiftKey && selectCtx.lastSelectedPath !== null) {
      selectCtx.enterSelectionMode();
      const lastIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.lastSelectedPath
      );
      if (lastIdx !== -1) {
        const startIdx = Math.min(lastIdx, globalIndex);
        const endIdx = Math.max(lastIdx, globalIndex);
        const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);

        if (e.ctrlKey || e.metaKey) selectCtx.deletePaths(paths);
        else selectCtx.addPaths(paths);

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
      if (!isSelected) selectCtx.selectPath(node.path);
      else {
        selectCtx.unselectPath(node.path);
        if (
          selectCtx.selectedPaths.size === 1 &&
          selectCtx.selectedPaths.has(node.path)
        ) {
          selectCtx.exitSelectionMode();
        }
      }
      onSelect?.();
    } else {
      onOpen?.(node);
    }
  };

  return (
    <HoverPreviewPortal node={node} enabled={isMediaNode && !isMobile}>
      <div
        role="row"
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchEnd={stop}
        onTouchMove={stop}
        onClick={isMobile ? handleTap : handleClick}
        onDoubleClick={!isMobile ? () => onOpen?.(node) : undefined}
        className={cn(
          "grid items-center h-12 border-b select-none cursor-pointer transition-colors text-sm",
          GRID_TEMPLATE,
          isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
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
              selectCtx.togglePath(node.path);
              onSelect?.();
            }}
          />
        </div>

        {/* Name */}
        <div className="flex items-center gap-3 overflow-hidden pr-2">
          <MediaThumbIcon
            type={node.type}
            className="w-5 h-5 shrink-0 opacity-70"
          />
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium">
              {node.title ?? node.name}
            </span>
            <span className="md:hidden text-[10px] text-muted-foreground truncate">
              {node.isDirectory
                ? "Folder"
                : `${getExtension(node.name)} • ${formatBytes(node.size)}`}
            </span>
          </div>
        </div>

        {/* デスクトップ専用カラム */}
        <div className="hidden md:block text-muted-foreground text-xs uppercase">
          {node.isDirectory
            ? "Folder"
            : getExtension(node.name, { withDot: false })}
        </div>
        <div className="hidden md:block text-muted-foreground text-xs tabular-nums">
          <LocalDate value={node.mtime} />
        </div>
        <div className="hidden md:block text-muted-foreground text-xs tabular-nums">
          {node.isDirectory ? "-" : formatBytes(node.size)}
        </div>
        <div className="hidden md:block flex items-center overflow-hidden">
          {node.isDirectory && (
            <FolderStatusBadge
              date={node.lastViewedAt}
              className="border-none bg-transparent p-0"
            />
          )}
        </div>

        {/* Favorite: モバイルでも表示 */}
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {node.isDirectory ? (
            <FavoriteCountBadge count={node.favoriteCount ?? 0} />
          ) : (
            <FavoriteButton
              variant="list"
              active={isFavorite}
              onClick={toggleFavorite}
            />
          )}
        </div>

        {/* Actions: モバイルでも表示 */}
        <div className="flex justify-center">
          <ActionMenu
            node={node}
            onRename={onRename}
            onMove={onMove}
            onEditTags={onEditTags}
            onOpenFolder={onOpenFolder}
          />
        </div>
      </div>
    </HoverPreviewPortal>
  );
}

/* -------------------------------------------------------------------------- */
/* Action Menu Component                                                      */
/* -------------------------------------------------------------------------- */

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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
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
