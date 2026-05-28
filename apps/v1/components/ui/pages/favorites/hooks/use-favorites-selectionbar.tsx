import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/components/ui/pages/favorites/hooks/use-favorites-favorites";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import { TagIcon } from "lucide-react";
import { useMemo } from "react";

interface UseFavoritesSelectionbarProps {
  tagEditor: TagEditorControl;
  favorites: FavoritesFavorites;
}

export function useFavoritesSelectionbar({
  tagEditor,
  favorites,
}: UseFavoritesSelectionbarProps) {
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
                    favorites.update({
                      targets: nodes,
                      newRating,
                      onSuccess: closeMenu,
                    })
                  }
                />
              </div>
            );
          },
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [favorites]
  );

  return {
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
