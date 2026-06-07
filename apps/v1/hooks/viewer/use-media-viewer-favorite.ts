import { MediaNode } from "@/lib/media/types";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseMediaViewerFavoriteProps {
  currentNode: MediaNode | null;
  onChange?: (value: { isFavorite: boolean; rating: number | null }) => void;
}

export function useMediaViewerFavorite({
  currentNode,
  onChange,
}: UseMediaViewerFavoriteProps) {
  const control = useFavoritesControlContext();
  const [isPending, setIsPending] = useState(false);

  const favoriteState = useMemo(() => {
    if (!currentNode) {
      return {
        isFavorite: false,
        rating: null,
      };
    }
    return control.getFavorite(currentNode.path);
  }, [control, currentNode]);

  const toggleFavorite = useCallback(async () => {
    if (!currentNode || isPending) return;
    setIsPending(true);

    try {
      const { isFavorite } = control.getFavorite(currentNode.path);
      const nextIsFavorite = !isFavorite;

      await control.toggleFavorite(currentNode.path);

      toast.info(
        nextIsFavorite
          ? "⭐お気に入りに登録しました"
          : "お気に入りを解除しました",
        { duration: 1000 }
      );

      onChange?.({ isFavorite: nextIsFavorite, rating: null });
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    } finally {
      setIsPending(false);
    }
  }, [currentNode, isPending, control, onChange]);

  const changeRating = useCallback(
    async (rating: number | null) => {
      if (!currentNode || isPending) return;
      setIsPending(true);

      try {
        await control.updateFavorite(currentNode.path, rating);

        toast.info(
          rating != null
            ? "⭐レーティングを更新しました"
            : "レーティングを解除しました",
          { duration: 1000 }
        );

        onChange?.({ isFavorite: true, rating });
      } catch (e) {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      } finally {
        setIsPending(false);
      }
    },
    [currentNode, isPending, control, onChange]
  );

  return {
    ...favoriteState,
    isPending,
    toggleFavorite,
    changeRating,
  };
}
