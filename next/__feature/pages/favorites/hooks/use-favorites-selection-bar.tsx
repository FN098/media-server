import { FavoritesFavorites } from "@/__feature/pages/favorites/hooks/use-favorites-favorites";
import { NodeSelectionControl } from "@/__feature/selection/hooks/use-node-selection-control";
import { ManyNodesContext, MenuItemDef } from "@/__lib/menu-items/types";
import { hasMediaFile } from "@/__lib/node/media-types";
import { averageBy } from "@/__lib/utils/math";
import { FavoriteRatingInput } from "@/feature/favorite/ui/favorite-rating-input";
import { TagEditor } from "@/feature/tag-editor/_hooks/use-tag-editor";
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
  const inlineItems: MenuItemDef<ManyNodesContext>[] = [
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
  ] satisfies MenuItemDef<ManyNodesContext>[];

  return {
    items,
    inlineItems,
  };
}

interface UseFavoritesSelectionBarProps {
  selection: NodeSelectionControl;
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
    () => hasMediaFile(selectedNodes),
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
