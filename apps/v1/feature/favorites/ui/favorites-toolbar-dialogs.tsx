import { useFavoritesContext } from "@/feature/favorites/providers/favorites-provider";
import { RatingFilterDialog } from "@/feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/filter/ui/tag-filter-dialog";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
