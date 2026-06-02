import { MediaNode } from "@/lib/media/types";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

type UpdateProps = {
  targets: MediaNode[];
  newRating: number | null;
  onSuccess?: () => void;
};

/**
 * @deprecated
 * @todo 削除対象
 */
export function useExplorerFavorites() {
  const { getFavorite, updateMultipleFavorites } = useFavoritesControlContext();

  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    ({ targets, newRating, onSuccess }: UpdateProps) => {
      if (isPending) return;

      startTransition(async () => {
        const paths = targets.map((target) => target.path);
        const result = await updateMultipleFavorites({
          paths,
          newRating,
        });

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

export type ExplorerFavorites = ReturnType<typeof useExplorerFavorites>;
