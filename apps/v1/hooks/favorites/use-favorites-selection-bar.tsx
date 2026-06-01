import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { hasMedia } from "@/lib/media/detectors";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import { TagIcon } from "lucide-react";
import { useMemo } from "react";

interface UseFavoritesSelectionBarProps {
  selection: MediaNodeSelection;
  tagEditor: TagEditorControl;
  favorites: FavoritesFavorites;
}

export function useFavoritesSelectionBar({
  selection,
  tagEditor,
  favorites,
}: UseFavoritesSelectionBarProps) {
  const { selectedNodes } = selection;

  const isMediaSelected = useMemo(
    () => hasMedia(selectedNodes),
    [selectedNodes]
  );

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
                  disabled={!isMediaSelected}
                />
              </div>
            );
          },
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [favorites, isMediaSelected]
  );

  return {
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
