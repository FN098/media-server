import { MediaNode } from "@/lib/media/types";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type UpdateProps = {
  targets: MediaNode[];
  newRating: number | null;
  onSuccess?: () => void;
};

export function useExplorerFavorites() {
  const {
    getFavorite,
    updateMultipleFavorites,
    updateFavorite,
    deleteFavorite,
  } = useFavoritesControlContext();
  const [isPending, setIsPending] = useState(false);

  const update = useCallback(
    async ({ targets, newRating, onSuccess }: UpdateProps) => {
      if (isPending) return;
      setIsPending(true);

      const paths = targets.map((target) => target.path);
      const result = await updateMultipleFavorites({
        paths,
        newRating,
      });

      if (result.success) {
        toast.success("レーティングが更新されました。", { duration: 500 });
        onSuccess?.();
      } else {
        toast.error(result.message);
      }

      setIsPending(false);
    },
    [isPending, updateMultipleFavorites]
  );

  const refreshPath = useCallback(
    async (prevPath: string, nextPath: string) => {
      const fav = getFavorite(prevPath);
      await deleteFavorite(prevPath);
      await updateFavorite(nextPath, fav.rating);
    },
    [deleteFavorite, getFavorite, updateFavorite]
  );

  return {
    get: getFavorite,
    update,
    refreshPath,
  };
}

export type ExplorerFavorites = ReturnType<typeof useExplorerFavorites>;
