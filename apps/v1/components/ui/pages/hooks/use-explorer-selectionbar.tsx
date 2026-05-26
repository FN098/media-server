import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { MediaNode } from "@/lib/media/types";
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

type UseExplorerSelectionbarProps = {
  hasSelection: boolean;
  onChangeRating: (props: {
    node: MediaNode;
    newRating: number | null;
    onSuccess?: () => void;
  }) => void;
  onChangeRatingSelected: (props: {
    newRating: number | null;
    onSuccess?: () => void;
  }) => void;
  onMoveSelected: () => void;
  onCopySelected: () => void;
  onEditTagsSelected: () => void;
  onUpdateThumbSelected: () => void;
  onDeleteSelected: () => void;
  onAddFavoriteSelected: () => void;
  onRemoveFavoriteSelected: () => void;
};

export function useExplorerSelectionbar({
  hasSelection,
  onChangeRatingSelected,
  onChangeRating,
  onMoveSelected,
  onCopySelected,
  onEditTagsSelected,
  onUpdateThumbSelected,
  onDeleteSelected,
  onAddFavoriteSelected,
  onRemoveFavoriteSelected,
}: UseExplorerSelectionbarProps) {
  const inlineMenuItems: MenuItemDef<MultipleNodesContext>[] = useMemo(
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

  const menuItems: MenuItemDef<MultipleNodesContext>[] = useMemo(
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
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
