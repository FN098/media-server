import { MediaType } from "@/generated/prisma/enums";
import {
  TrashFilterMenuContext,
  useTrashFilterMenuItems,
} from "@/hooks/trash/use-trash-filter-menu-items";
import { isMedia } from "@/lib/media/detectors";
import { useTrashContext } from "@/providers/trash-provider";
import { useCallback, useMemo } from "react";

export function useTrashFilterMenu() {
  const {
    listing,
    filtering: {
      controls: { favorite, mediaType, rating, tag },
    },
    dialogs: { ratingFilterDialog, tagFilterDialog },
  } = useTrashContext();

  const favoriteFilterMode = useMemo(
    () => favorite.value.mode,
    [favorite.value.mode]
  );

  const mediaTypes = useMemo(
    () =>
      mediaType.value.types.filter((type): type is MediaType => isMedia(type)),
    [mediaType.value.types]
  );

  const hasRatingFilter = useMemo(
    () => rating.value.mode !== "all",
    [rating.value.mode]
  );

  const hasTagFilter = useMemo(
    () => tag.value.tags.length > 0,
    [tag.value.tags]
  );

  const toggleFavoriteOnly = useCallback(() => {
    const nextMode =
      favoriteFilterMode === "only_favorites" ? "all" : "only_favorites";
    favorite.apply({ mode: nextMode });
  }, [favorite, favoriteFilterMode]);

  const toggleNonFavoriteOnly = useCallback(() => {
    const nextMode =
      favoriteFilterMode === "exclude_favorites" ? "all" : "exclude_favorites";
    favorite.apply({ mode: nextMode });
  }, [favorite, favoriteFilterMode]);

  const toggleMediaType = useCallback(
    (type: MediaType) => {
      if (mediaTypes.includes(type)) {
        mediaType.reset();
      } else {
        mediaType.apply({ types: [type] });
      }
    },
    [mediaType, mediaTypes]
  );

  const openRatingFilter = useCallback(
    () => ratingFilterDialog.open(rating.value),
    [rating.value, ratingFilterDialog]
  );

  const openTagFilter = useCallback(
    () => tagFilterDialog.open(tag.value, listing.nodes),
    [listing.nodes, tag.value, tagFilterDialog]
  );

  const context = useMemo(() => {
    return {
      favoriteFilterMode,
      mediaTypes,
      hasRatingFilter,
      hasTagFilter,
      toggleFavoriteOnly,
      toggleNonFavoriteOnly,
      toggleMediaType,
      openRatingFilter,
      openTagFilter,
    } satisfies TrashFilterMenuContext;
  }, [
    favoriteFilterMode,
    mediaTypes,
    openRatingFilter,
    openTagFilter,
    hasRatingFilter,
    hasTagFilter,
    toggleFavoriteOnly,
    toggleMediaType,
    toggleNonFavoriteOnly,
  ]);

  const items = useTrashFilterMenuItems({ context });

  return {
    items,
    context,
  };
}
