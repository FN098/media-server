import { RatingFilterDialog } from "@/__feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/__feature/filter/ui/tag-filter-dialog";
import { useFavoritesContext } from "@/__feature/pages/favorites/providers/favorites-provider";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
