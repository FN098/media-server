import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FavoritesDialogs as FavoritesDialogsType } from "@/hooks/favorites/use-favorites-dialogs";

interface FavoritesDialogsProps {
  dialogs: FavoritesDialogsType;
}

export function FavoritesDialogs({}: FavoritesDialogsProps) {
  return <></>;
}

interface FavoritesToolbarDialogsProps {
  dialogs: FavoritesDialogsType;
}

export function FavoritesToolbarDialogs({
  dialogs,
}: FavoritesToolbarDialogsProps) {
  const { ratingFilterDialog, tagFilterDialog } = dialogs;

  return (
    <>
      {/* 評価フィルターダイアログ */}
      <RatingFilterDialog dialog={ratingFilterDialog} />

      {/* タグフィルター */}
      <TagFilterDialog dialog={tagFilterDialog} />
    </>
  );
}
