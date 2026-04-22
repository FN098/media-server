"use client";

import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { MediaActions } from "@/hooks/use-media-actions";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import {
  Copy,
  ExternalLink,
  Folder,
  FolderInput,
  ImagePlus,
  ListFilterPlus,
  MoreVertical,
  Pencil,
  RefreshCw,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

// TODO: actions => ActionItem
interface ActionsDropdownMenuProps {
  node: MediaNode;
  actions: MediaActions;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function ActionsDropdownMenu({
  node,
  actions,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  className,
}: ActionsDropdownMenuProps) {
  const {
    onOpenInNewTab: openInNewTab,
    onChangeRating: changeRating,
    onOpenParentFolder: openParentFolder,
    onRename: rename,
    onMove: move,
    onCopy: copy,
    onEditTags: editTags,
    onAddTagFilter: addTagFilter,
    onSetAsPreview: setAsPreview,
    onRestore: restore,
    onDelete: deleteAction,
    onDeletePermanently: deletePermanently,
    onUpdateThumb: updateThumb,
  } = actions;

  const isMobile = useIsMobile();

  // 外部から渡されたオープン状態を優先
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
              value={rating}
              onChange={(value) => void changeRating(node, value)}
              variant="menu"
            />
          </DropdownMenuItem>
        )}

        {openInNewTab && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void openInNewTab(node);
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> 新しいタブで開く
          </DropdownMenuItem>
        )}

        {openParentFolder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void openParentFolder(node);
            }}
          >
            <Folder className="mr-2 h-4 w-4" />
            <span>フォルダを開く</span>
            {!isMobile && (
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                <kbd className="rounded border px-1.5 py-0.5">O</kbd>
              </div>
            )}
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

        {updateThumb && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              void updateThumb(node);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> サムネイルを更新
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
