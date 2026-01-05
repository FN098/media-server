"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { LocalDate } from "@/components/ui/dates/local-date";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/formatter";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import React, { useMemo } from "react";
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
  return (
    <div className="w-full h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Last Viewed</TableHead>
            <TableHead>Favorite</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allNodes.map((node, index) => (
            <RowItem
              key={node.path}
              node={node}
              allNodes={allNodes}
              index={index}
              onOpen={onOpen}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RowItem({
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
    if (!isMediaNode || isLongPressed || !isMobile) return;

    e.preventDefault();

    // 選択モード中
    if (isSelectionMode) {
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
    selectPath(node.path);
    setLastSelectedPath(node.path);
  };

  const {
    start: startLongPress,
    stop: stopLongPress,
    isLongPressed,
  } = useLongPress(handleLongPress, 600);

  return (
    <TableRow
      onMouseDown={startLongPress}
      onMouseUp={stopLongPress}
      onMouseLeave={stopLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={stopLongPress}
      onTouchMove={stopLongPress} // スクロール時に長押しをキャンセル
      onClick={isMobile ? handleTap : handleClick}
      onDoubleClick={isMobile ? undefined : handleDoubleClick}
      className={cn(
        "select-none cursor-pointer transition-colors",
        selected
          ? "bg-primary/10 hover:bg-primary/20"
          : "hover:bg-muted/50 active:bg-muted"
      )}
    >
      <TableCell>
        <div className={cn("transition-opacity")}>
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckedChange}
            onClick={(e) => e.stopPropagation()}
            disabled={!isMedia(node.type)}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MediaThumbIcon type={node.type} className="w-6 h-6" />
          <span className="truncate">{node.title ?? node.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {node.isDirectory
          ? "folder"
          : getExtension(node.name, { withDot: false, case: "lower" })}
      </TableCell>
      <TableCell>
        <LocalDate value={node.mtime} />
      </TableCell>
      <TableCell>{formatBytes(node.size)}</TableCell>
      <TableCell>
        {node.isDirectory && (
          <FolderStatusBadge date={node.lastViewedAt} className="border-none" />
        )}
      </TableCell>
      <TableCell>
        {node.isDirectory ? (
          <FavoriteCountBadge
            count={node.favoriteCount ?? 0}
            className="border-none"
          />
        ) : (
          <FavoriteButton
            variant="list"
            active={favorite}
            onClick={handleToggleFavorite}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
