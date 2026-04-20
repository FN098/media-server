"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { MediaActions } from "@/hooks/use-media-actions";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";
import {
  Copy,
  ExternalLink,
  Folder,
  FolderInput,
  ImagePlus,
  ListFilterPlus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";

interface ActionsContextMenuProps {
  node: MediaNode;
  actions: MediaActions;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  rating?: number;
}

export function ActionsContextMenu({
  node,
  actions,
  children,
  open,
  onOpenChange,
  disabled = false,
  rating,
}: ActionsContextMenuProps) {
  const {
    onOpenInNewTab,
    onChangeRating,
    onOpenParentFolder,
    onRename,
    onMove,
    onCopy,
    onEditTags,
    onAddTagFilter,
    onSetAsPreview,
    onRestore,
    onDelete,
    onDeletePermanently,
    onUpdateThumb,
  } = actions;

  const mounted = useMounted();
  if (!mounted || disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu modal={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {rating && onChangeRating && !node.isDirectory && (
          <ContextMenuItem className="flex justify-center">
            <FavoriteRating
              value={rating}
              onChange={(value) => void onChangeRating(node, value)}
              variant="menu"
            />
          </ContextMenuItem>
        )}

        {onOpenInNewTab && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onOpenInNewTab(node);
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> 新しいタブで開く
          </ContextMenuItem>
        )}

        {onOpenParentFolder && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onOpenParentFolder(node);
            }}
          >
            <Folder className="mr-2 h-4 w-4" /> フォルダを開く
          </ContextMenuItem>
        )}

        {onRename && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onRename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </ContextMenuItem>
        )}

        {onMove && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onMove(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 移動
          </ContextMenuItem>
        )}

        {onCopy && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onCopy(node);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> コピー
          </ContextMenuItem>
        )}

        {onEditTags && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onEditTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </ContextMenuItem>
        )}

        {onAddTagFilter && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onAddTagFilter(node);
            }}
            disabled={!node.tags || node.tags.length === 0}
          >
            <ListFilterPlus className="mr-2 h-4 w-4" /> タグをフィルターに追加
          </ContextMenuItem>
        )}

        {onSetAsPreview && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onSetAsPreview(node);
            }}
            disabled={node.type !== "image" && node.type !== "video"}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> プレビューに設定
          </ContextMenuItem>
        )}

        {onUpdateThumb && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void onUpdateThumb(node);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> サムネイルを更新
          </ContextMenuItem>
        )}

        {onRestore && (
          <ContextMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              void onRestore(node);
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
              void onDelete(node);
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
              void onDeletePermanently(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 完全に削除
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
