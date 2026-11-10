import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";
import { RatingFilterDialog } from "@/feature/_old/filter/ui/rating-filter-dialog";
import { TagFilterDialog } from "@/feature/_old/filter/ui/tag-filter-dialog";

export function ExplorerToolbarDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
