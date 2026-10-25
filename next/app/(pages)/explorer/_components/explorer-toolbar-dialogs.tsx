import { RatingFilterDialog } from "@/__feature/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/__feature/filter/ui/tag-filter-dialog";
import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";

export function ExplorerToolbarDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
