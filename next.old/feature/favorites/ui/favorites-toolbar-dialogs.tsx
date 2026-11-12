import { useFavoritesContext } from "@/feature/_old/favorites/providers/favorites-provider";
import { RatingFilterDialog } from "@/feature/_old/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/_old/filter/ui/tag-filter-dialog";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
