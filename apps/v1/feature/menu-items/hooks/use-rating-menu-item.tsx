import { FavoriteRatingInput } from "@/feature/favorite/ui/favorite-rating-input";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useMemo } from "react";

interface UseRatingMenuItemProps {
  getFavorite: (path: string) => { rating: number | null };
  updateFavorite: (props: {
    targets: MediaNode[];
    newRating: number | null;
    onSuccess?: () => void;
  }) => void;
  selectedNodes: MediaNode[];
  hasSelection: boolean;
}

export function useRatingMenuItem({
  getFavorite,
  updateFavorite,
  hasSelection,
  selectedNodes,
}: UseRatingMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "rating",
      type: "custom",
      render: ({ node, closeMenu }) => {
        const { rating } = getFavorite(node.path);
        const targets = hasSelection ? selectedNodes : [node];

        return (
          <div className="w-full flex justify-center">
            <FavoriteRatingInput
              value={rating}
              onChange={(newRating) =>
                updateFavorite({ targets, newRating, onSuccess: closeMenu })
              }
            />
          </div>
        );
      },
      hidden: ({ node }) => node.isDirectory,
    }),
    [getFavorite, hasSelection, selectedNodes, updateFavorite]
  );
}
