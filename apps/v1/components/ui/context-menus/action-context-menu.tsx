"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { useFavoritesContext } from "@/providers/favorites-provider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";
import {
  Copy,
  FolderInput,
  ListFilterPlus,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";

interface ActionContextMenuProps {
  node: MediaNode;
  children: React.ReactNode;
  onOpenFolder?: (path: string) => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onCopy?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
  onDeletePermanently?: (node: MediaNode) => void;
  onRestore?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
  onAddTagFilter?: (node: MediaNode) => void;
  onRatingChange?: (node: MediaNode, rating: number | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ActionContextMenu({
  node,
  children,
  onOpenFolder,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onDeletePermanently,
  onRestore,
  onEditTags,
  onAddTagFilter,
  onRatingChange,
  open,
  onOpenChange,
}: ActionContextMenuProps) {
  const { getFavorite } = useFavoritesContext();

  const mounted = useMounted();
  if (!mounted) return <>{children}</>;

  const { rating } = getFavorite(node.path);

  return (
    <ContextMenu modal={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {onRatingChange && !node.isDirectory && (
          <ContextMenuItem className="flex justify-center">
            <FavoriteRating
              rating={rating}
              onRatingChange={(rating) => onRatingChange(node, rating)}
              variant="menu"
            />
          </ContextMenuItem>
        )}

        {onOpenFolder && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(getParentDirPath(node.path));
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> フォルダを開く
          </ContextMenuItem>
        )}

        {onRename && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </ContextMenuItem>
        )}

        {onMove && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 移動
          </ContextMenuItem>
        )}

        {onCopy && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onCopy(node);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> コピー
          </ContextMenuItem>
        )}

        {onEditTags && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </ContextMenuItem>
        )}

        {onAddTagFilter && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddTagFilter(node);
            }}
            disabled={!node.tags || node.tags.length === 0}
          >
            <ListFilterPlus className="mr-2 h-4 w-4" /> タグをフィルターに追加
          </ContextMenuItem>
        )}

        {onRestore && (
          <ContextMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(node);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> 復元
          </ContextMenuItem>
        )}

        {onDelete && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 削除
          </ContextMenuItem>
        )}

        {onDeletePermanently && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePermanently(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 完全に削除
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
