import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { isArchiveFile } from "@/lib/archive/extensions";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
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
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

type UseExplorerMenuProps = {
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
  onAddTagsToFilter: (node: MediaNode) => void;
  onApplyAsPreview: (node: MediaNode) => void;
  onUpdateThumb: (node: MediaNode) => void;
  onUpdateThumbSelected: () => void;
  onDelete: (node: MediaNode) => void;
  onDeleteSelected: () => void;
};

export function useExplorerMenu({
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
  onAddTagsToFilter,
  onApplyAsPreview,
  onUpdateThumb,
  onUpdateThumbSelected,
  onDelete,
  onDeleteSelected,
}: UseExplorerMenuProps) {
  const items: MenuItemDef<NodeContext>[] = useMemo(
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

  return {
    items,
  };
}
