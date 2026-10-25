import { isMediaFile, MediaType } from "@/__lib/node/media-types";
import {
  ExplorerFilterMenuContext,
  useExplorerFilterMenuItems,
} from "@/app/(pages)/explorer/_hooks/use-explorer-filter-menu-items";
import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";
import { useCallback, useMemo } from "react";

export function useExplorerFilterMenu() {
  const {
    listing,
    filtering: {
      controls: { favorite, mediaType, tag },
    },
    dialogs: { tagFilterDialog },
  } = useExplorerContext();

  const favoriteFilterMode = useMemo(
    () => favorite.value.mode,
    [favorite.value.mode]
  );

  const mediaTypes = useMemo(
    () =>
      mediaType.value.types.filter((type): type is MediaType =>
        isMediaFile(type)
      ),
    [mediaType.value.types]
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

  const openTagFilter = useCallback(
    () => tagFilterDialog.open(tag.value, listing.children),
    [listing.children, tag.value, tagFilterDialog]
  );

  const context = useMemo(() => {
    return {
      favoriteFilterMode,
      mediaTypes,
      hasTagFilter,
      toggleFavoriteOnly,
      toggleNonFavoriteOnly,
      toggleMediaType,
      openTagFilter,
    } satisfies ExplorerFilterMenuContext;
  }, [
    favoriteFilterMode,
    mediaTypes,
    openTagFilter,
    hasTagFilter,
    toggleFavoriteOnly,
    toggleMediaType,
    toggleNonFavoriteOnly,
  ]);

  const items = useExplorerFilterMenuItems({ context });

  return {
    items,
    context,
  };
}
