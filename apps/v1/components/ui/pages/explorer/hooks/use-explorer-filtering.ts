import { useFavoriteFilter } from "@/hooks/use-favorite-filter";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useTagFilter } from "@/hooks/use-tag-filter";
import {
  createFavoriteFilter,
  createMediaOnlyFilter,
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
  withDirectoryControl,
} from "@/lib/filter/factory";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export type ExplorerFiltering = ReturnType<typeof useExplorerFiltering>;

interface UseExplorerFilteringProps {
  listing: MediaListing;
}

export function useExplorerFiltering({ listing }: UseExplorerFilteringProps) {
  const queryFilter = useQueryFilter();
  const mediaTypeFilter = useMediaTypeFilter();
  const ratingFilter = useRatingFilter();
  const tagFilter = useTagFilter();
  const favoriteFilter = useFavoriteFilter();

  // フィルターパイプライン
  const pipeline = useMemo(
    () => [
      withDirectoryControl(
        createSearchFilter(queryFilter.value),
        "apply-filter"
      ),
      withDirectoryControl(
        createMediaTypeFilter(mediaTypeFilter.value),
        "apply-filter"
      ),
      withDirectoryControl(
        createRatingFilter(ratingFilter.value),
        "apply-filter"
      ),
      withDirectoryControl(createTagFilter(tagFilter.value), "always"),
      withDirectoryControl(
        createFavoriteFilter(favoriteFilter.value),
        "always"
      ),
    ],
    [
      queryFilter.value,
      mediaTypeFilter.value,
      ratingFilter.value,
      tagFilter.value,
      favoriteFilter.value,
    ]
  );

  // フィルター結果
  const { filtered, filteredCount, totalCount, isFiltered } = useFilteredNodes(
    listing.nodes,
    pipeline
  );

  // 「メディアのみ」のフィルターパイプライン
  const mediaOnlyPipeline = useMemo(() => [createMediaOnlyFilter()], []);

  // 「メディアのみ」のリスト
  const { filtered: mediaOnly } = useFilteredNodes(filtered, mediaOnlyPipeline);

  // タグをフィルターに追加
  const addTagFilter = useCallback(
    (node: MediaNode) => {
      if (!node.tags || node.tags.length === 0) return;

      tagFilter.apply({
        mode: tagFilter.value.mode,
        tags: [...tagFilter.value.tags, ...node.tags],
      });
    },
    [tagFilter]
  );

  // 検索パラメータリセット用
  const search = useSearchParamsControl({ keep: ["viewMode"] });

  return {
    filteredNodes: filtered,
    filteredCount,
    totalCount,
    isFiltered,
    mediaOnly,
    addTagFilter,
    canReset: search.canClear,
    reset: search.clear,
    controls: {
      query: queryFilter,
      mediaType: mediaTypeFilter,
      rating: ratingFilter,
      tag: tagFilter,
      favorite: favoriteFilter,
    },
  };
}
