import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { isArchiveFile } from "@/lib/archive/extensions";
import { MediaNode } from "@/lib/media/types";
import {
  MenuItemDef,
  MultipleNodesContext,
  NodeContext,
} from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import {
  CopyIcon,
  ExternalLinkIcon,
  FolderInputIcon,
  FullscreenIcon,
  ImagePlusIcon,
  ListFilterPlusIcon,
  PackageOpenIcon,
  PencilIcon,
  RefreshCwIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

type UseExplorerMenuItemsProps = {
  hasSelection: boolean;
  selectedCount: number;
  isViewerMode: boolean;
  isFullscreenSupported: boolean;
  getFavorite: (path: string) => { rating: number | null };
  onOpenInNewTab: (node: MediaNode) => void;
  onExtract: (node: MediaNode) => void;
  onExtractSelected: () => void;
  onChangeRating: (props: {
    node: MediaNode;
    newRating: number | null;
    onSuccess?: () => void;
  }) => void;
  onChangeRatingSelected: (props: {
    newRating: number | null;
    onSuccess?: () => void;
  }) => void;
  onToggleFullscreen: () => void;
  onRename: (node: MediaNode) => void;
  onMove: (node: MediaNode) => void;
  onMoveSelected: () => void;
  onCopy: (node: MediaNode) => void;
  onCopySelected: () => void;
  onEditTags: (node: MediaNode) => void;
  onEditTagsSelected: () => void;
  onAddTagsToFilter: (node: MediaNode) => void;
  onApplyAsPreview: (node: MediaNode) => void;
  onUpdateThumb: (node: MediaNode) => void;
  onUpdateThumbSelected: () => void;
  onDelete: (node: MediaNode) => void;
  onDeleteSelected: () => void;
  onAddFavoriteSelected: () => void;
  onRemoveFavoriteSelected: () => void;
};

export function useExplorerMenuItems({
  hasSelection,
  selectedCount,
  isViewerMode,
  isFullscreenSupported,
  getFavorite,
  onOpenInNewTab,
  onExtractSelected,
  onExtract,
  onChangeRatingSelected,
  onChangeRating,
  onToggleFullscreen,
  onRename,
  onMove,
  onMoveSelected,
  onCopy,
  onCopySelected,
  onEditTags,
  onEditTagsSelected,
  onAddTagsToFilter,
  onApplyAsPreview,
  onUpdateThumb,
  onUpdateThumbSelected,
  onDelete,
  onDeleteSelected,
  onAddFavoriteSelected,
  onRemoveFavoriteSelected,
}: UseExplorerMenuItemsProps) {
  const menuItems: MenuItemDef<NodeContext>[] = useMemo(
    () => [
      {
        key: "rating",
        type: "custom",
        render: ({ node, closeMenu }) => {
          if (node.isDirectory) return null;

          const { rating } = getFavorite(node.path);
          return (
            <div className="w-full flex justify-center">
              <FavoriteRatingInput
                value={rating}
                onChange={(newRating) =>
                  hasSelection
                    ? onChangeRatingSelected({
                        newRating,
                        onSuccess: closeMenu,
                      })
                    : onChangeRating({
                        node,
                        newRating,
                        onSuccess: closeMenu,
                      })
                }
              />
            </div>
          );
        },
      },
      {
        key: "openInNewTab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => onOpenInNewTab(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "toggleFullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: onToggleFullscreen,
        hidden: () => !isViewerMode || !isFullscreenSupported,
      },
      {
        key: "extractArchive",
        type: "action",
        icon: PackageOpenIcon,
        label: "解凍",
        onClick: ({ node }) =>
          hasSelection ? onExtractSelected() : onExtract(node),
        hidden: ({ node }) => !isArchiveFile(node.path),
      },
      {
        key: "rename",
        type: "action",
        icon: PencilIcon,
        label: "名前の変更",
        onClick: ({ node }) => onRename(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "move",
        type: "action",
        icon: FolderInputIcon,
        label: "移動",
        onClick: ({ node }) => (hasSelection ? onMoveSelected() : onMove(node)),
      },
      {
        key: "copy",
        type: "action",
        icon: CopyIcon,
        label: "コピー",
        onClick: ({ node }) => (hasSelection ? onCopySelected() : onCopy(node)),
      },
      {
        key: "editTags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: ({ node }) => onEditTags(node),
      },
      {
        key: "addTagFilter",
        type: "action",
        icon: ListFilterPlusIcon,
        label: "タグをフィルターに追加",
        onClick: ({ node }) => onAddTagsToFilter(node),
        hidden: ({ node }) =>
          !node.tags || node.tags.length === 0 || selectedCount > 1,
      },
      {
        key: "setAsPreview",
        type: "action",
        icon: ImagePlusIcon,
        label: "プレビューに設定",
        onClick: ({ node }) => onApplyAsPreview(node),
        hidden: ({ node }) =>
          (node.type !== "image" && node.type !== "video") || selectedCount > 1,
      },
      {
        key: "updateThumb",
        type: "action",
        icon: RefreshCwIcon,
        label: "サムネイルを更新",
        onClick: ({ node }) =>
          hasSelection ? onUpdateThumbSelected() : onUpdateThumb(node),
        hidden: () => isViewerMode,
      },
      {
        key: "delete",
        type: "action",
        icon: Trash2Icon,
        variant: "destructive",
        label: "削除",
        onClick: ({ node }) =>
          hasSelection ? onDeleteSelected() : onDelete(node),
      },
    ],
    [
      getFavorite,
      hasSelection,
      isFullscreenSupported,
      isViewerMode,
      onAddTagsToFilter,
      onApplyAsPreview,
      onChangeRating,
      onChangeRatingSelected,
      onCopy,
      onCopySelected,
      onDelete,
      onDeleteSelected,
      onEditTags,
      onExtract,
      onExtractSelected,
      onMove,
      onMoveSelected,
      onOpenInNewTab,
      onRename,
      onToggleFullscreen,
      onUpdateThumb,
      onUpdateThumbSelected,
      selectedCount,
    ]
  );

  const selectionBarInlineMenuItems: MenuItemDef<MultipleNodesContext>[] =
    useMemo(
      () => [
        {
          key: "editTags",
          type: "action",
          icon: TagIcon,
          label: "タグ編集",
          onClick: onEditTagsSelected,
        },
      ],
      [onEditTagsSelected]
    );

  const selectionBarMenuItems: MenuItemDef<MultipleNodesContext>[] = useMemo(
    () => [
      {
        key: "rating",
        type: "custom",
        render: ({ nodes, closeMenu }) => {
          const filtered = nodes.filter((n) => n.rating != null);
          const averageRating = averageBy(filtered, (n) => n.rating!);

          return (
            <div className="w-full flex justify-center p-1">
              <FavoriteRatingInput
                value={averageRating}
                onChange={(newRating) =>
                  hasSelection
                    ? onChangeRatingSelected({
                        newRating,
                        onSuccess: closeMenu,
                      })
                    : onChangeRating({
                        node: nodes[0],
                        newRating,
                        onSuccess: closeMenu,
                      })
                }
              />
            </div>
          );
        },
      },
      {
        key: "add-favorites",
        type: "action",
        icon: StarIcon,
        label: "お気に入り登録",
        onClick: onAddFavoriteSelected,
      },
      {
        key: "remove-favorites",
        type: "action",
        icon: StarOffIcon,
        label: "お気に入り解除",
        onClick: onRemoveFavoriteSelected,
      },
      {
        key: "move",
        type: "action",
        icon: FolderInputIcon,
        label: "移動",
        onClick: onMoveSelected,
      },
      {
        key: "copy",
        type: "action",
        icon: CopyIcon,
        label: "コピー",
        onClick: onCopySelected,
      },
      {
        key: "update-thumb",
        type: "action",
        icon: RefreshCwIcon,
        label: "サムネイル更新",
        onClick: onUpdateThumbSelected,
      },
      {
        key: "delete",
        type: "action",
        variant: "destructive",
        icon: Trash2Icon,
        label: "削除",
        onClick: onDeleteSelected,
      },
    ],
    [
      hasSelection,
      onAddFavoriteSelected,
      onChangeRating,
      onChangeRatingSelected,
      onCopySelected,
      onDeleteSelected,
      onMoveSelected,
      onRemoveFavoriteSelected,
      onUpdateThumbSelected,
    ]
  );

  return {
    menuItems,
    selectionBarMenuItems,
    selectionBarInlineMenuItems,
  };
}
