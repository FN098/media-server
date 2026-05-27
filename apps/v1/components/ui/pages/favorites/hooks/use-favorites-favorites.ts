import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

export type FavoritesFavorites = ReturnType<typeof useFavoritesFavorites>;

type UpdateProps = {
  node: MediaNode;
  newRating: number | null;
  onSuccess?: () => void;
};

type UpdateSelectedProps = {
  newRating: number | null;
  onSuccess?: () => void;
};

interface UseFavoritesFavoritesProps {
  targetNodes: MediaNode[];
}

export function useFavoritesFavorites({
  targetNodes,
}: UseFavoritesFavoritesProps) {
  const { updateFavorite, getFavorite, updateMultipleFavorites } =
    useFavoritesContext();

  const [updatingFavorite, startUpdatingFavorite] = useTransition();

  const update = useCallback(
    ({ node, newRating, onSuccess }: UpdateProps) => {
      if (updatingFavorite) return;

      startUpdatingFavorite(async () => {
        const result = await updateFavorite(node.path, newRating);

        if (result.success) {
          toast.success("レーティングが更新されました。", { duration: 500 });
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      });
    },
    [updateFavorite, updatingFavorite]
  );

  const updateSelected = useCallback(
    ({ newRating, onSuccess }: UpdateSelectedProps) => {
      if (updatingFavorite) return;

      startUpdatingFavorite(async () => {
        const paths = targetNodes.map((node) => node.path);
        const result = await updateMultipleFavorites(paths, {
          rating: newRating,
        });

        if (result.success) {
          toast.success("レーティングが更新されました。", { duration: 500 });
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      });
    },
    [targetNodes, updateMultipleFavorites, updatingFavorite]
  );

  return {
    get: getFavorite,
    update,
    updateSelected,
  };
}
