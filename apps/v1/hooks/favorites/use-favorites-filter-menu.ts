import { isMedia } from "@/lib/media/detectors";
import { MediaType } from "@/lib/media/types";
import {
  FavoritesFilterMenuContext,
  favoritesFilterMenuItems,
} from "@/lib/menu-items/favorites-filter-menu-items";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useMemo } from "react";

const transformer = createRecursiveTransformer<
  MenuItemDef<FavoritesFilterMenuContext>,
  FavoritesFilterMenuContext
>(defaultFilters);

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
    [mediaType]
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

  const transformed = useMemo(
    () => transformer(favoritesFilterMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
