"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import {
  Copy,
  FolderInput,
  ListFilterPlus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface ActionDropdownMenuProps {
  node: MediaNode;
  className?: string;
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

export function ActionDropdownMenu({
  node,
  className,
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
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: ActionDropdownMenuProps) {
  const { getFavorite } = useFavoritesContext();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  const mounted = useMounted();
  if (!mounted) return null;

  const { rating } = getFavorite(node.path);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* アクションメニュートリガーボタン */}
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setOpen(!open)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      {/* アクションメニュー */}
      <DropdownMenuContent align="end" className="min-w-48">
        {onRatingChange && !node.isDirectory && (
          <DropdownMenuItem className="flex justify-center">
            <FavoriteRating
              rating={rating}
              onRatingChange={(rating) => onRatingChange(node, rating)}
              variant="menu"
            />
          </DropdownMenuItem>
        )}

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

        {onCopy && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onCopy(node);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> コピー
          </DropdownMenuItem>
        )}

        {onEditTags && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </DropdownMenuItem>
        )}

        {onAddTagFilter && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddTagFilter(node);
            }}
            disabled={!node.tags || node.tags.length === 0}
          >
            <ListFilterPlus className="mr-2 h-4 w-4" /> タグをフィルターに追加
          </DropdownMenuItem>
        )}

        {onRestore && (
          <DropdownMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(node);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            復元
          </DropdownMenuItem>
        )}

        {onDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        )}

        {onDeletePermanently && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePermanently(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            完全に削除
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
