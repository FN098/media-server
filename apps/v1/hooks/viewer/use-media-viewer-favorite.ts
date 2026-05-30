import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";

interface UseMediaViewerFavoriteProps {
  currentNode: MediaNode | null;
  interactHeader?: () => void;
}

export function useMediaViewerFavorite({
  currentNode,
  interactHeader,
}: UseMediaViewerFavoriteProps) {
  const { toggleFavorite, updateFavorite, getFavorite } = useFavoritesContext();

  const [isPending, startTransition] = useTransition();

  const favoriteState = useMemo(() => {
    if (!currentNode) {
      return {
        isFavorite: false,
        rating: null,
      };
    }

    const { isFavorite = false, rating = null } = getFavorite(currentNode.path);

    return {
      isFavorite,
      rating,
    };
  }, [currentNode, getFavorite]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentNode) return;

    startTransition(async () => {
      try {
        const { isFavorite } = getFavorite(currentNode.path);
        const nextIsFavorite = !isFavorite;

        await toggleFavorite(currentNode.path);

        toast.info(
          nextIsFavorite
            ? "⭐お気に入りに登録しました"
            : "お気に入りを解除しました",
          { duration: 1000 }
        );

        interactHeader?.();
      } catch (e) {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      }
    });
  }, [currentNode, getFavorite, toggleFavorite, interactHeader]);

  const handleChangeRating = useCallback(
    (rating: number | null) => {
      if (!currentNode) return;

      startTransition(async () => {
        try {
          await updateFavorite(currentNode.path, rating);

          toast.info(
            rating != null
              ? "⭐レーティングを更新しました"
              : "レーティングを解除しました",
            { duration: 1000 }
          );

          interactHeader?.();
        } catch (e) {
          console.error(e);
          toast.error("お気に入りの更新に失敗しました");
        }
      });
    },
    [currentNode, updateFavorite, interactHeader]
  );

  return {
    ...favoriteState,
    isPending,
    toggleFavorite: handleToggleFavorite,
    changeRating: handleChangeRating,
  };
}
