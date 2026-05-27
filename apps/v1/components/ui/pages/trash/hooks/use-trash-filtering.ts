import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useTagFilter } from "@/hooks/use-tag-filter";
import {
  createMediaOnlyFilter,
  createMediaTypeFilter,
  createSearchFilter,
  createTagFilter,
  withDirectoryControl,
} from "@/lib/filter/factory";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export type TrashFiltering = ReturnType<typeof useTrashFiltering>;

interface UseTrashFilteringProps {
  listing: MediaListing;
}

export function useTrashFiltering({ listing }: UseTrashFilteringProps) {
  const queryFilter = useQueryFilter();
  const mediaTypeFilter = useMediaTypeFilter();
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
      withDirectoryControl(createTagFilter(tagFilter.value), "always"),
    ],
    [queryFilter.value, mediaTypeFilter.value, tagFilter.value]
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
      tag: tagFilter,
    },
  };
}
