import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerThumbs } from "@/components/ui/pages/explorer/hooks/use-explorer-thumbs";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
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

interface UseExplorerSelectionbarProps {
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
}

export function useExplorerSelectionbar({
  dialogs,
  tagEditor,
  favorites,
  thumbs,
}: UseExplorerSelectionbarProps) {
  const { favoriteDialog, deleteDialog, copyDialog, moveDialog } = dialogs;

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
              <div className="w-full flex justify-center p-1">
                <FavoriteRatingInput
                  value={averageRating}
                  onChange={(newRating) =>
                    favorites.updateSelected({
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
          onClick: () => favoriteDialog.openSelected({ mode: "add" }),
        },
        {
          key: "remove-favorites",
          type: "action",
          icon: StarOffIcon,
          label: "お気に入り解除",
          onClick: () => favoriteDialog.openSelected({ mode: "remove" }),
        },
        {
          key: "move",
          type: "action",
          icon: FolderInputIcon,
          label: "移動",
          onClick: moveDialog.openSelected,
        },
        {
          key: "copy",
          type: "action",
          icon: CopyIcon,
          label: "コピー",
          onClick: copyDialog.openSelected,
        },
        {
          key: "update-thumb",
          type: "action",
          icon: RefreshCwIcon,
          label: "サムネイル更新",
          onClick: () => void thumbs.updateSelected(),
        },
        {
          key: "delete",
          type: "action",
          variant: "destructive",
          icon: Trash2Icon,
          label: "削除",
          onClick: deleteDialog.openSelected,
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [
      copyDialog.openSelected,
      deleteDialog.openSelected,
      favoriteDialog,
      favorites,
      moveDialog.openSelected,
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
