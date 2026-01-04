"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { LocalDateValue } from "@/components/ui/local-date";
import { MediaThumbIcon } from "@/components/ui/media-thumb";
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
import { cn } from "@/shadcn/lib/utils";
import { useMemo } from "react";
import { toast } from "sonner";

export function ExplorerListView({
  allNodes,
  onOpen,
}: {
  allNodes: MediaNode[];
  onOpen?: (node: MediaNode) => void;
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
          {allNodes.map((node) => (
            <RowItem key={node.path} node={node} onOpen={onOpen} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RowItem({
  node,
  onOpen,
}: {
  node: MediaNode;
  onOpen?: (node: MediaNode) => void;
}) {
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  const {
    isSelectionMode,
    isPathSelected,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectPath,
    unselectPath,
    replaceSelection,
  } = usePathSelectionContext();

  const favorite = useMemo(
    () => isFavorite(node.path),
    [isFavorite, node.path]
  );

  const selected = useMemo(
    () => isPathSelected(node.path),
    [isPathSelected, node.path]
  );

  const handleSelectChange = (selected: boolean) => {
    enterSelectionMode();

    if (selected) {
      selectPath(node.path);
    } else {
      unselectPath(node.path);

      // 現在の選択数が1件のみで、かつその1件を解除しようとしている場合
      if (selectedPaths.size === 1 && selectedPaths.has(node.path)) {
        exitSelectionMode();
      }
    }
  };

  const handleToggleFavorite = () => {
    try {
      void toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  const {
    start: startLongPress,
    stop: stopLongPress,
    isLongPressed,
  } = useLongPress(() => {
    if (isMedia(node.type)) handleSelectChange(true);
  }, 600);

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressed) return;

    const isCmdOrCtrl = e.ctrlKey || e.metaKey;

    if (isSelectionMode) {
      if (!isMedia(node.type)) {
        if (node.isDirectory) toast.warning("フォルダは選択できません！");
        return;
      }

      if (isCmdOrCtrl) {
        handleSelectChange(!selected);
      } else {
        // Ctrlなし：これだけを選択
        replaceSelection(node.path);
      }
    } else {
      // 選択モードではない時、Ctrlクリックで選択モードを開始する
      if (isCmdOrCtrl && isMedia(node.type)) {
        handleSelectChange(true);
      } else {
        onOpen?.(node);
      }
    }
  };

  return (
    <TableRow
      onMouseDown={startLongPress}
      onMouseUp={stopLongPress}
      onMouseLeave={stopLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={stopLongPress}
      onTouchMove={stopLongPress} // スクロール時に長押しをキャンセル
      onClick={handleClick}
      className={cn("hover:bg-blue-100 active:bg-blue-200")}
    >
      <TableCell>
        <div className={cn("transition-opacity")}>
          <Checkbox
            checked={selected}
            onCheckedChange={handleSelectChange}
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
        <LocalDateValue value={node.mtime} />
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
