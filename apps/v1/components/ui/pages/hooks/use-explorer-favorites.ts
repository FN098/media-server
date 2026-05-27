import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

interface UseExplorerFavoritesProps {
  selectedNodes: MediaNode[];
}

export function useExplorerFavorites({
  selectedNodes,
}: UseExplorerFavoritesProps) {
  const { updateFavorite, getFavorite, updateMultipleFavorites } =
    useFavoritesContext();

  const [updatingFavorite, startUpdatingFavorite] = useTransition();

  const update = useCallback(
    ({
      node,
      newRating,
      onSuccess,
    }: {
      node: MediaNode;
      newRating: number | null;
      onSuccess?: () => void;
    }) => {
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
    ({
      newRating,
      onSuccess,
    }: {
      newRating: number | null;
      onSuccess?: () => void;
    }) => {
      if (updatingFavorite) return;
      startUpdatingFavorite(async () => {
        const paths = selectedNodes.map((node) => node.path);
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
    [selectedNodes, updateMultipleFavorites, updatingFavorite]
  );

  return {
    get: getFavorite,
    update,
    updateSelected,
  };
}
