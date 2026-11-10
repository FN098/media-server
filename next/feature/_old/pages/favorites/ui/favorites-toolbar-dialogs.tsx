import { RatingFilterDialog } from "@/feature/_old/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/_old/filter/ui/tag-filter-dialog";
import { useFavoritesContext } from "@/feature/_old/pages/favorites/providers/favorites-provider";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
