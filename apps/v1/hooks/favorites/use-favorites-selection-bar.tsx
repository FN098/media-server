import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { hasMedia } from "@/lib/media/detectors";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import { TagIcon } from "lucide-react";
import { useMemo } from "react";

interface FavoritesSelectionBarMenuContext {
  isMediaSelected: boolean;
  tagEditor: TagEditor;
  favorites: FavoritesFavorites;
}

function createFavoritesSelectionBarMenu({
  isMediaSelected,
  tagEditor,
  favorites,
}: FavoritesSelectionBarMenuContext) {
  const inlineItems: MenuItemDef<MultipleNodesContext>[] = [
    {
      key: "editTags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: tagEditor.open,
    },
  ];

  const items = [
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
                void favorites.update({
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
  ] satisfies MenuItemDef<MultipleNodesContext>[];

  return {
    items,
    inlineItems,
  };
}

interface UseFavoritesSelectionBarProps {
  selection: MediaNodeSelection;
  tagEditor: TagEditor;
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

  const menu = useMemo(
    () =>
      createFavoritesSelectionBarMenu({
        isMediaSelected,
        tagEditor,
        favorites,
      }),
    [favorites, isMediaSelected, tagEditor]
  );

  return {
    menu,
  };
}
