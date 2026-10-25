import { useFavoritesControlContext } from "@/__feature/favorite/providers/favorites-control-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useExplorerFavorites() {
  const { getFavorite, addManyFavorites, addFavorite, removeFavorite } =
    useFavoritesControlContext();

  const [isPending, setIsPending] = useState(false);

  const update = useCallback(
    async ({
      entries,
      onSuccess,
    }: {
      entries: {
        id: string;
        isDirectory: boolean;
      }[];
      onSuccess?: () => void;
    }) => {
      if (isPending) return;
      setIsPending(true);

      const result = await addManyFavorites({
        entries,
      });

      if (result.success) {
        toast.success("レーティングが更新されました。", { duration: 500 });
        onSuccess?.();
      } else {
        toast.error(result.message);
      }

      setIsPending(false);
    },
    [isPending, addManyFavorites]
  );

  const refresh = useCallback(
    async (id: string, isDirectory: boolean) => {
      const current = getFavorite(id);
      if (current.isFavorite) {
        await removeFavorite(id, isDirectory);
        await addFavorite(id, isDirectory);
      }
    },
    [removeFavorite, getFavorite, addFavorite]
  );

  return {
    get: getFavorite,
    update,
    refresh,
  };
}

export type ExplorerFavorites = ReturnType<typeof useExplorerFavorites>;
