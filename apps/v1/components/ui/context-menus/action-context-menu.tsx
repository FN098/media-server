"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { Actions } from "@/hooks/use-actions";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { useActionsContext } from "@/providers/actions-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
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
  ImageMinus,
  ImagePlus,
  ListFilterPlus,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";

interface ActionContextMenuProps {
  node: MediaNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  overrides?: Partial<Actions>;
  disabled?: boolean;
}

export function ActionContextMenu({
  node,
  children,
  open,
  onOpenChange,
  overrides,
  disabled = false,
}: ActionContextMenuProps) {
  const { actions: contextActions } = useActionsContext();
  const { getFavorite } = useFavoritesContext();
  const mounted = useMounted();

  const actions = useMemo(
    () => ({
      ...contextActions,
      ...overrides,
    }),
    [contextActions, overrides]
  );

  if (!mounted || disabled) {
    return <>{children}</>;
  }

  const {
    openInNewTab,
    changeRating,
    openParentFolder,
    rename,
    move,
    copy,
    editTags,
    addTagFilter,
    setAsPreview,
    restore,
    delete: deleteAction,
    deletePermanently,
    updateThumb,
  } = actions;

  const { rating } = getFavorite(node.path);

  return (
    <ContextMenu modal={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {changeRating && !node.isDirectory && (
          <ContextMenuItem className="flex justify-center">
            <FavoriteRating
              rating={rating}
              onRatingChange={(rating) => void changeRating(node, rating)}
              variant="menu"
            />
          </ContextMenuItem>
        )}

        {openInNewTab && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void openInNewTab(node);
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> 新しいタブで開く
          </ContextMenuItem>
        )}

        {openParentFolder && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void openParentFolder(node);
            }}
          >
            <Folder className="mr-2 h-4 w-4" /> フォルダを開く
          </ContextMenuItem>
        )}

        {rename && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void rename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </ContextMenuItem>
        )}

        {move && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void move(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 移動
          </ContextMenuItem>
        )}

        {copy && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void copy(node);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> コピー
          </ContextMenuItem>
        )}

        {editTags && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void editTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </ContextMenuItem>
        )}

        {addTagFilter && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void addTagFilter(node);
            }}
            disabled={!node.tags || node.tags.length === 0}
          >
            <ListFilterPlus className="mr-2 h-4 w-4" /> タグをフィルターに追加
          </ContextMenuItem>
        )}

        {setAsPreview && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void setAsPreview(node);
            }}
            disabled={node.type !== "image" && node.type !== "video"}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> プレビューに設定
          </ContextMenuItem>
        )}

        {updateThumb && !node.isDirectory && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void updateThumb(node);
            }}
          >
            <ImageMinus className="mr-2 h-4 w-4" /> サムネイルを更新
          </ContextMenuItem>
        )}

        {restore && (
          <ContextMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              void restore(node);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> 復元
          </ContextMenuItem>
        )}

        {deleteAction && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              void deleteAction(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 削除
          </ContextMenuItem>
        )}

        {deletePermanently && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              void deletePermanently(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 完全に削除
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
