import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FavoritesDialogs as FavoritesDialogsType } from "@/components/ui/pages/favorites/hooks/use-favorites-dialogs";
import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

interface FavoritesDialogsProps {
  dialogs: FavoritesDialogsType;
}

export function FavoritesDialogs({}: FavoritesDialogsProps) {
  return <></>;
}

interface FavoritesToolbarDialogsProps {
  dialogs: FavoritesDialogsType;
  filtering: FavoritesFiltering;
}

export function FavoritesToolbarDialogs({
  dialogs,
  filtering,
}: FavoritesToolbarDialogsProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* 評価フィルターダイアログ */}
      <RatingFilterDialog
        open={dialogs.ratingFilterDialog.isOpen}
        onOpenChange={(open) => !open && dialogs.ratingFilterDialog.close()}
        value={dialogs.ratingFilterDialog.currentValue}
        onChange={filtering.controls.rating.apply}
      />

      {/* タグフィルター */}
      <TagFilterDialog
        open={dialogs.tagFilterDialog.isOpen}
        onOpenChange={(open) => !open && dialogs.tagFilterDialog.close()}
        value={filtering.controls.tag.value}
        onChange={filtering.controls.tag.apply}
        relatedNodes={filtering.mediaOnly}
        autoFocusInput={!isMobile}
      />
    </>
  );
}
