import { useFilteredNodes } from "@/feature/filter/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/feature/filter/hooks/use-media-type-filter";
import { useQueryFilter } from "@/feature/filter/hooks/use-query-filter";
import { useRatingFilter } from "@/feature/filter/hooks/use-rating-filter";
import { useTagFilter } from "@/feature/filter/hooks/use-tag-filter";
import { useSearchParamsControl } from "@/feature/general/hooks/use-search-params-control";
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
  const { filtered, filteredCount, totalCount, isFiltered } = useFilteredNodes({
    targets: listing.nodes,
    pipeline,
  });

  // 「メディアのみ」のフィルターパイプライン
  const mediaOnlyPipeline = useMemo(() => [createMediaOnlyFilter()], []);

  // 「メディアのみ」のリスト
  const { filtered: mediaOnly } = useFilteredNodes({
    targets: filtered,
    pipeline: mediaOnlyPipeline,
  });

  // タグをフィルターに追加
  const addTagFilter = useCallback(
    (targets: MediaNode | MediaNode[]) => {
      const nodes = Array.isArray(targets) ? targets : [targets];

      const tags = nodes.flatMap((node) => node.tags ?? []);

      if (tags.length === 0) return;

      tagFilter.apply({
        mode: tagFilter.value.mode,
        tags: [...tagFilter.value.tags, ...tags],
      });
    },
    [tagFilter]
  );

  const canAddTagFilter = useCallback((targets: MediaNode | MediaNode[]) => {
    const nodes = Array.isArray(targets) ? targets : [targets];

    return nodes.some((node) => (node.tags?.length ?? 0) > 0);
  }, []);

  // 検索パラメータリセット用
  const search = useSearchParamsControl({ keep: ["viewMode"] });

  return {
    filteredNodes: filtered,
    filteredCount,
    totalCount,
    isFiltered,
    mediaOnly,
    canAddTagFilter,
    addTagFilter,
    canReset: search.canClear,
    reset: search.clear,
    controls: {
      query: queryFilter,
      mediaType: mediaTypeFilter,
      rating: ratingFilter,
      tag: tagFilter,
    },
  };
}

export type FavoritesFiltering = ReturnType<typeof useFavoritesFiltering>;
