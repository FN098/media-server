import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

export type FavoritesFavorites = ReturnType<typeof useFavoritesFavorites>;

type UpdateProps = {
  targets: MediaNode[];
  newRating: number | null;
  onSuccess?: () => void;
};

export function useFavoritesFavorites() {
  const { getFavorite, updateMultipleFavorites } = useFavoritesContext();

  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    ({ targets, newRating, onSuccess }: UpdateProps) => {
      if (isPending) return;

      startTransition(async () => {
        const paths = targets.map((target) => target.path);
        const result = await updateMultipleFavorites(paths, newRating);

        if (result.success) {
          toast.success("レーティングが更新されました。", { duration: 500 });
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      });
    },
    [isPending, updateMultipleFavorites]
  );

  return {
    get: getFavorite,
    update,
  };
}
