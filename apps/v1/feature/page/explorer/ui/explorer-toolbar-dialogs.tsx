import { RatingFilterDialog } from "@/feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/filter/ui/tag-filter-dialog";
import { useExplorerContext } from "@/feature/page/explorer/providers/explorer-provider";

export function ExplorerToolbarDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
