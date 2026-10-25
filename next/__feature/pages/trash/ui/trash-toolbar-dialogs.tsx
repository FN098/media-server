import { RatingFilterDialog } from "@/__feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/__feature/filter/ui/tag-filter-dialog";
import { useTrashContext } from "@/__feature/pages/trash/providers/trash-provider";

export function TrashToolbarDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
