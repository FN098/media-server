import {
  FavoritesFilterMenuContext,
  useFavoritesFilterMenuItems,
} from "@/feature/page/favorites/hooks/use-favorites-filter-menu-items";
import { useFavoritesContext } from "@/feature/page/favorites/providers/favorites-provider";
import { isMedia } from "@/lib/media/detectors";
import { MediaType } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export function useFavoritesFilterMenu() {
  const {
    listing,
    filtering: {
      controls: { mediaType, rating, tag },
    },
    dialogs: { ratingFilterDialog, tagFilterDialog },
  } = useFavoritesContext();

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
      mediaTypes,
      hasRatingFilter,
      hasTagFilter,
      toggleMediaType,
      openRatingFilter,
      openTagFilter,
    } satisfies FavoritesFilterMenuContext;
  }, [
    mediaTypes,
    openRatingFilter,
    openTagFilter,
    hasRatingFilter,
    hasTagFilter,
    toggleMediaType,
  ]);

  const items = useFavoritesFilterMenuItems({ context });

  return {
    items,
    context,
  };
}
