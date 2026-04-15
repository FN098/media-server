"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { Actions } from "@/hooks/use-actions";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { useActionsContext } from "@/providers/actions-provider";
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
  Folder,
  FolderInput,
  ImageMinus,
  ImagePlus,
  ListFilterPlus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ActionDropdownMenuProps {
  node: MediaNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  overrides?: Partial<Actions>;
}

export function ActionDropdownMenu({
  node,
  className,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  overrides,
}: ActionDropdownMenuProps) {
  const { actions: contextActions } = useActionsContext();

  const actions = useMemo(
    () => ({
      ...contextActions,
      ...overrides,
    }),
    [contextActions, overrides]
  );

  const {
    changeRating,
    openParentFolder,
    rename,
    move,
    copy,
    editTags,
    addTagFilter,
    setAsPreview,
    resetPreview,
    restore,
    delete: deleteAction,
    deletePermanently,
  } = actions;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  const { getFavorite } = useFavoritesContext();
  const { rating } = getFavorite(node.path);

  const mounted = useMounted();
  if (!mounted) return null;

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
        {changeRating && !node.isDirectory && (
          <DropdownMenuItem className="flex justify-center">
            <FavoriteRating
              rating={rating}
              onRatingChange={(rating) => void changeRating(node, rating)}
              variant="menu"
            />
          </DropdownMenuItem>
        )}

        {openParentFolder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void openParentFolder(node);
            }}
          >
            <Folder className="mr-2 h-4 w-4" /> フォルダを開く
          </DropdownMenuItem>
        )}

        {rename && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void rename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </DropdownMenuItem>
        )}

        {move && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void move(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 移動
          </DropdownMenuItem>
        )}

        {copy && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void copy(node);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> コピー
          </DropdownMenuItem>
        )}

        {editTags && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void editTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </DropdownMenuItem>
        )}

        {addTagFilter && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void addTagFilter(node);
            }}
            disabled={!node.tags || node.tags.length === 0}
          >
            <ListFilterPlus className="mr-2 h-4 w-4" /> タグをフィルターに追加
          </DropdownMenuItem>
        )}

        {setAsPreview && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void setAsPreview(node);
            }}
            disabled={node.type !== "image" && node.type !== "video"}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> プレビューに設定
          </DropdownMenuItem>
        )}

        {resetPreview && !node.isDirectory && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void resetPreview(node);
            }}
            disabled={node.previewPath === null}
          >
            <ImageMinus className="mr-2 h-4 w-4" /> プレビューを解除
          </DropdownMenuItem>
        )}

        {restore && (
          <DropdownMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              void restore(node);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            復元
          </DropdownMenuItem>
        )}

        {deleteAction && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              void deleteAction(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        )}

        {deletePermanently && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              void deletePermanently(node);
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
