import { RatingFilterDialog } from "@/feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/filter/ui/tag-filter-dialog";
import { useTrashContext } from "@/feature/trash/providers/trash-provider";

export function TrashToolbarDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
