"use client";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavoriteCountBadge } from "@/components/ui/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/folder-status-badge";
import { LocalDateValue } from "@/components/ui/local-date";
import { MediaThumbIcon } from "@/components/ui/media-thumb";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/formatter";
import { useFavorite } from "@/providers/favorite-provider";
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
import { memo, useRef } from "react";
import { toast } from "sonner";

type ListViewProps = {
  nodes: MediaNode[];
  onOpen?: (target: MediaNode, index: number) => void;
};

export const ListView = memo(function ListView1({
  nodes,
  onOpen,
}: ListViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  return (
    <div ref={containerRef} className="w-full h-full">
      <Table>
        <TableHeader>
          <TableRow>
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
              onClick={() => onOpen?.(node, index)}
              onDoubleClick={() => !isMobile && onOpen?.(node, index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

type RowItemProps = {
  node: MediaNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
};

function RowItem({ node, onClick, onDoubleClick, className }: RowItemProps) {
  const favoriteCtx = useFavorite();

  const handleToggleFavorite = async (node: MediaNode) => {
    try {
      await favoriteCtx.toggleFavorite(node.path);
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  return (
    <TableRow
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={className}
    >
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
