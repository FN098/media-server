import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useTagFilter } from "@/hooks/use-tag-filter";
import {
  createMediaOnlyFilter,
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
  withDirectoryControl,
} from "@/lib/filter/factory";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export type FavoritesFiltering = ReturnType<typeof useFavoritesFiltering>;

interface UseFavoritesFilteringProps {
  listing: MediaListing;
}

export function useFavoritesFiltering({ listing }: UseFavoritesFilteringProps) {
  const queryFilter = useQueryFilter();
  const mediaTypeFilter = useMediaTypeFilter();
  const ratingFilter = useRatingFilter();
  const tagFilter = useTagFilter();

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
    ],
    [
      queryFilter.value,
      mediaTypeFilter.value,
      ratingFilter.value,
      tagFilter.value,
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
  const { hasResettableSearchParams, clearSearchParams } =
    useSearchParamsControl({ keep: ["viewMode"] });

  return {
    filteredNodes: filtered,
    filteredCount,
    totalCount,
    isFiltered,
    mediaOnly,
    addTagFilter,
    canReset: hasResettableSearchParams,
    reset: clearSearchParams,
    controls: {
      query: queryFilter,
      mediaType: mediaTypeFilter,
      rating: ratingFilter,
      tag: tagFilter,
    },
  };
}
