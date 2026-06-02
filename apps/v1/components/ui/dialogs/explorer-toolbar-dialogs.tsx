import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { useExplorerContext } from "@/providers/explorer-provider";

export function ExplorerToolbarDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <RatingFilterDialog dialog={dialogs.ratingFilterDialog} />
      <TagFilterDialog dialog={dialogs.tagFilterDialog} />
    </>
  );
}
