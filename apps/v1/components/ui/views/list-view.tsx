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
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/formatter";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef } from "react";
import { toast } from "sonner";

export function ListView({
  allNodes,
  onOpen,
  onSelect,
}: {
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: allNodes.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40, // 行高さ固定（px）
    overscan: 10,
  });

  return (
    <div className="w-full h-full flex flex-col">
      <HeaderRow />

      <div ref={containerRef} className="flex-1 overflow-auto relative">
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const node = allNodes[vRow.index];

            return (
              <div
                key={node.path}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                <DataRow
                  node={node}
                  index={vRow.index}
                  allNodes={allNodes}
                  isMobile={isMobile}
                  onOpen={onOpen}
                  onSelect={onSelect}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeaderRow() {
  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_80px_140px_100px_140px_80px]",
        "h-10 items-center border-b bg-background px-2 text-sm font-medium"
      )}
    >
      <div />
      <div>Name</div>
      <div>Type</div>
      <div>Updated</div>
      <div>Size</div>
      <div>Last Viewed</div>
      <div>Favorite</div>
    </div>
  );
}

function DataRow({
  node,
  index,
  allNodes,
  isMobile,
  onOpen,
  onSelect,
}: {
  node: MediaNode;
  index: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  onOpen?: (node: MediaNode) => void;
  onSelect?: () => void;
}) {
  const isMediaNode = React.useMemo(() => isMedia(node.type), [node.type]);

  /* ================= Favorite ================= */

  const favCtx = useFavoritesContext();
  const isFavorite = favCtx.isFavorite(node.path);

  const toggleFavorite = () => {
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

    if (e.shiftKey && selectCtx.lastSelectedPath) {
      const lastIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.lastSelectedPath
      );
      if (lastIdx !== -1) {
        const [s, eIdx] = [Math.min(lastIdx, index), Math.max(lastIdx, index)];
        const paths = allNodes
          .slice(s, eIdx + 1)
          .filter((n) => isMedia(n.type))
          .map((n) => n.path);
        selectCtx.enterSelectionMode();
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
    <HoverPreviewPortal node={node} enabled={isMediaNode && !isMobile}>
      <div
        id={`media-item-${index}`} // 自動スクロールで使う
        role="row"
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchEnd={stop}
        onTouchMove={stop}
        onClick={isMobile ? handleTap : handleClick}
        onDoubleClick={isMobile ? undefined : handleDoubleClick}
        className={cn(
          "grid grid-cols-[40px_1fr_80px_140px_100px_140px_80px]",
          "h-10 items-center px-2 border-b select-none cursor-pointer",
          isSelected ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"
        )}
      >
        {/* 選択チェックボックス */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} />
        </div>

        {/* サムネイル */}
        <div className="flex items-center gap-2 truncate">
          <MediaThumbIcon type={node.type} className="w-6 h-6 shrink-0" />
          <span className="truncate">{node.title ?? node.name}</span>
        </div>

        {/* ファイルタイプ */}
        <div>
          {node.isDirectory
            ? "folder"
            : getExtension(node.name, { withDot: false })}
        </div>

        {/* 更新日時 */}
        <div>
          <LocalDate value={node.mtime} />
        </div>

        {/* ファイルサイズ */}
        <div>{formatBytes(node.size)}</div>

        {/* 最終閲覧日 */}
        <div>
          {node.isDirectory && (
            <FolderStatusBadge
              date={node.lastViewedAt}
              className="border-none"
            />
          )}
        </div>

        {/* お気に入り件数/お気に入りボタン */}
        <div onClick={(e) => e.stopPropagation()}>
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
      </div>
    </HoverPreviewPortal>
  );
}
