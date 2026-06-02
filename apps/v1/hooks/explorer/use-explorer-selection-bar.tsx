import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { ExplorerThumbs } from "@/hooks/explorer/use-explorer-thumbs";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { hasMedia } from "@/lib/media/detectors";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import {
  CopyIcon,
  FolderInputIcon,
  RefreshCwIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

interface UseExplorerSelectionBarProps {
  listing: MediaListing;
  selection: MediaNodeSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
}

export function useExplorerSelectionBar({
  listing,
  selection,
  dialogs,
  tagEditor,
  favorites,
  thumbs,
}: UseExplorerSelectionBarProps) {
  const { hasSelection, selectedNodes } = selection;
  const { favoriteDialog, deleteDialog, copyDialog, moveDialog } = dialogs;

  const isMediaSelected = useMemo(
    () => hasMedia(selectedNodes),
    [selectedNodes]
  );

  /**
   * @todo グローバルホイスト
   * @see hooks/explorer/use-explorer-actions.ts
   */
  const inlineMenuItems: MenuItemDef<MultipleNodesContext>[] = useMemo(
    () => [
      {
        key: "editTags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: tagEditor.open,
      },
    ],
    [tagEditor.open]
  );

  const menuItems = useMemo(
    () =>
      [
        {
          key: "rating",
          type: "custom",
          render: ({ nodes, closeMenu }) => {
            const filtered = nodes.filter((n) => n.rating != null);
            const averageRating = averageBy(filtered, (n) => n.rating!);

            return (
              <div className="w-full flex justify-center p-2">
                <FavoriteRatingInput
                  value={averageRating}
                  onChange={(newRating) =>
                    favorites.update({
                      targets: nodes,
                      newRating,
                      onSuccess: closeMenu,
                    })
                  }
                  disabled={!isMediaSelected}
                />
              </div>
            );
          },
        },
        {
          key: "separator-favorite-action",
          type: "separator",
        },
        {
          key: "add-favorites",
          type: "action",
          icon: StarIcon,
          label: "お気に入り登録",
          onClick: () => favoriteDialog.open(selectedNodes, "add"),
          disabled: () => !isMediaSelected,
        },
        {
          key: "remove-favorites",
          type: "action",
          icon: StarOffIcon,
          label: "お気に入り解除",
          onClick: () => favoriteDialog.open(selectedNodes, "remove"),
          disabled: () => !isMediaSelected,
        },
        {
          key: "separator-fs-operation",
          type: "separator",
        },
        {
          key: "move",
          type: "action",
          icon: FolderInputIcon,
          label: "移動",
          onClick: () => moveDialog.open(selectedNodes, listing.path),
          disabled: () => !hasSelection,
        },
        {
          key: "copy",
          type: "action",
          icon: CopyIcon,
          label: "コピー",
          onClick: () => copyDialog.open(selectedNodes, listing.path),
          disabled: () => !hasSelection,
        },
        {
          key: "update-thumb",
          type: "action",
          icon: RefreshCwIcon,
          label: "サムネイル更新",
          onClick: () => void thumbs.updateParallel(selectedNodes),
          disabled: () => !hasSelection,
        },
        {
          key: "separator-delete",
          type: "separator",
        },
        {
          key: "delete",
          type: "action",
          variant: "destructive",
          icon: Trash2Icon,
          label: "削除",
          onClick: () => deleteDialog.open(selectedNodes),
          disabled: () => !hasSelection,
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [
      copyDialog,
      deleteDialog,
      favoriteDialog,
      favorites,
      hasSelection,
      isMediaSelected,
      listing.path,
      moveDialog,
      selectedNodes,
      thumbs,
    ]
  );

  return {
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
