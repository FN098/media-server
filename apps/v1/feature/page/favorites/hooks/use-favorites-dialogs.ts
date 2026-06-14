import { useRatingFilterDialog } from "@/feature/filter/hooks/use-rating-filter-dialog";
import { useTagFilterDialog } from "@/feature/filter/hooks/use-tag-filter-dialog";
import { FavoritesFiltering } from "@/feature/page/favorites/hooks/use-favorites-filtering";
import { useMemo } from "react";

interface UseFavoritesDialogsProps {
  filtering: FavoritesFiltering;
}

export function useFavoritesDialogs({ filtering }: UseFavoritesDialogsProps) {
  const ratingFilterDialog = useRatingFilterDialog({
    onApply: filtering.controls.rating.apply,
  });

  const tagFilterDialog = useTagFilterDialog({
    onApply: filtering.controls.tag.apply,
    autoFocusInput: true,
  });

  const allDialogs = useMemo(
    () =>
      ({
        ratingFilterDialog,
        tagFilterDialog,
      }) as const,
    [ratingFilterDialog, tagFilterDialog]
  );

  const isOpen = useMemo(
    () => Object.values(allDialogs).some(({ isOpen }) => isOpen),
    [allDialogs]
  );

  return {
    ...allDialogs,
    isOpen,
  };
}

export type FavoritesDialogs = ReturnType<typeof useFavoritesDialogs>;
