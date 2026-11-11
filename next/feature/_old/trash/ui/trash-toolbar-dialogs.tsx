import { RatingFilterDialog } from "@/feature/_old/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/_old/filter/ui/tag-filter-dialog";
import { useTrashContext } from "@/feature/_old/trash/providers/trash-provider";

export function TrashToolbarDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
