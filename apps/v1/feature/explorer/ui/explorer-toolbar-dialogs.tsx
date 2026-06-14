import { useExplorerContext } from "@/feature/explorer/providers/explorer-provider";
import { RatingFilterDialog } from "@/feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/filter/ui/tag-filter-dialog";

export function ExplorerToolbarDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
