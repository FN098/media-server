"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { LocalDateValue } from "@/components/ui/local-date";
import { MediaThumbIcon } from "@/components/ui/media-thumb";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/formatter";
import { useFavorite } from "@/providers/favorite-provider";
import { useSelection } from "@/providers/selection-provider";
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
import { memo, useCallback, useRef } from "react";
import { toast } from "sonner";

type ListViewProps = {
  nodes: MediaNode[];
  onOpen?: (index: number) => void;
};

export const ListView = memo(function ListView1({
  nodes,
  onOpen,
}: ListViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectValues: selectPaths, clearSelection } = useSelection();

  const selectAll = useCallback(() => {
    const allPaths = nodes.map((n) => n.path);
    selectPaths(allPaths);
  }, [nodes, selectPaths]);

  useShortcutKeys([
    { key: "Ctrl+a", callback: selectAll },
    { key: "Escape", callback: clearSelection },
  ]);

  return (
    <div ref={containerRef} className="w-full h-full">
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
          {nodes.map((node, index) => (
            <RowItem
              key={node.path}
              node={node}
              className={cn("hover:bg-blue-100 active:bg-blue-200")}
              onOpen={() => onOpen?.(index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

type RowItemProps = {
  node: MediaNode;
  onOpen?: () => void;
  className?: string;
};

function RowItem({ node, onOpen, className }: RowItemProps) {
  const favoriteCtx = useFavorite();

  const handleToggleFavorite = async (node: MediaNode) => {
    try {
      await favoriteCtx.toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  const { isSelected, isSelectionMode, toggleSelection } = useSelection();
  const selected = isSelected(node.path);

  return (
    <TableRow
      onClick={() => {
        if (isSelectionMode) {
          toggleSelection(node.path);
        } else {
          onOpen?.();
        }
      }}
      className={className}
    >
      <TableCell>
        <div className={cn("transition-opacity")}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => toggleSelection(node.path)}
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
            active={favoriteCtx.isFavorite(node.path)}
            onToggle={() => void handleToggleFavorite(node)}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
