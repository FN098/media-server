import { useRatingFilterDialog } from "@/hooks/use-rating-filter-dialog";
import { useTagFilterDialog } from "@/hooks/use-tag-filter-dialog";
import { useMemo } from "react";

export type FavoritesDialogs = ReturnType<typeof useFavoritesDialogs>;

export function useFavoritesDialogs() {
  const ratingFilterDialog = useRatingFilterDialog();
  const tagFilterDialog = useTagFilterDialog();

  const all = useMemo(
    () =>
      ({
        ratingFilterDialog,
        tagFilterDialog,
      }) as const,
    [ratingFilterDialog, tagFilterDialog]
  );

  const isOpen = useMemo(
    () => Object.values(all).some(({ isOpen }) => isOpen),
    [all]
  );

  return {
    ...all,
    isOpen,
  };
}
