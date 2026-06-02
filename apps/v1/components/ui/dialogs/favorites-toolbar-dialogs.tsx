import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { useFavoritesContext } from "@/providers/favorites-provider";

export function FavoritesToolbarDialogs() {
  const { dialogs } = useFavoritesContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
