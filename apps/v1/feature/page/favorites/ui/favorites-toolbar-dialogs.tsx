import { RatingFilterDialog } from "@/feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/filter/ui/tag-filter-dialog";
import { useFavoritesContext } from "@/feature/page/favorites/providers/favorites-provider";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
