"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { LocalDateValue } from "@/components/ui/local-date";
import { MediaThumbIcon } from "@/components/ui/media-thumb";
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
import { useCallback } from "react";
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
  const { isSelected, isSelectionMode, toggleSelection } =
    usePathSelectionContext();

  const favorite = isFavorite(node.path);
  const selected = isSelected(node.path);

  const handleSelectOrOpen = useCallback(() => {
    if (isSelectionMode) {
      toggleSelection(node.path);
    } else {
      onOpen?.(node);
    }
  }, [isSelectionMode, node, onOpen, toggleSelection]);

  const handleSelect = useCallback(() => {
    toggleSelection(node.path);
  }, [node, toggleSelection]);

  const handleToggleFavorite = useCallback(() => {
    try {
      void toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  }, [node.path, toggleFavorite]);

  return (
    <TableRow
      onClick={handleSelectOrOpen}
      className={cn("hover:bg-blue-100 active:bg-blue-200")}
    >
      <TableCell>
        <div className={cn("transition-opacity")}>
          <Checkbox
            checked={selected}
            onCheckedChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
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
