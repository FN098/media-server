import { useFavoriteFilter } from "@/__feature/filter/hooks/use-favorite-filter";
import { useFilteredNodes } from "@/__feature/filter/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/__feature/filter/hooks/use-media-type-filter";
import { useQueryFilter } from "@/__feature/filter/hooks/use-query-filter";
import { useTagFilter } from "@/__feature/filter/hooks/use-tag-filter";
import { useSearchParamsControl } from "@/__feature/general/hooks/use-search-params-control";
import {
  createFavoriteFilter,
  createFileTypeFilter,
  createMediaOnlyFilter,
  createSearchFilter,
  createTagFilter,
  withDirectoryControl,
} from "@/__lib/filter/factory";
import { Node, NodeListing } from "@/lib/node/types";
import { useCallback, useMemo } from "react";

interface UseExplorerFilteringProps {
  listing: NodeListing;
}

export function useExplorerFiltering({ listing }: UseExplorerFilteringProps) {
  const queryFilter = useQueryFilter();
  const mediaTypeFilter = useMediaTypeFilter();
  const tagFilter = useTagFilter();
  const favoriteFilter = useFavoriteFilter();

  // フィルターパイプライン
  const filters = useMemo(
    () => [
      withDirectoryControl(
        createSearchFilter(queryFilter.value),
        "apply-filter"
      ),
      withDirectoryControl(
        createFileTypeFilter(mediaTypeFilter.value),
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
      tagFilter.value,
      favoriteFilter.value,
    ]
  );

  // フィルター結果
  const { filteredNodes, filteredCount, totalCount, isFiltered } =
    useFilteredNodes({
      nodes: listing.children,
      filters,
    });

  // 「メディアのみ」のフィルターパイプライン
  const mediaOnlyPipeline = useMemo(() => [createMediaOnlyFilter()], []);

  // 「メディアのみ」のリスト
  const { filteredNodes: mediaOnly } = useFilteredNodes({
    nodes: filteredNodes,
    filters: mediaOnlyPipeline,
  });

  // タグをフィルターに追加
  const addTagFilter = useCallback(
    (targets: Node | Node[]) => {
      const nodes = Array.isArray(targets) ? targets : [targets];

      const tags = nodes
        .filter((node) => !node.isDirectory)
        .flatMap((node) => node.tags ?? []);

      if (tags.length === 0) return;

      tagFilter.apply({
        mode: tagFilter.value.mode,
        tags: [...tagFilter.value.tags, ...tags],
      });
    },
    [tagFilter]
  );

  const canAddTagFilter = useCallback((targets: Node | Node[]) => {
    const nodes = Array.isArray(targets) ? targets : [targets];

    return nodes
      .filter((node) => !node.isDirectory)
      .some((node) => (node.tags?.length ?? 0) > 0);
  }, []);

  // 検索パラメータリセット用
  const search = useSearchParamsControl({
    keep: ["viewMode", "sort", "direction"],
  });

  return {
    filteredNodes,
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
      tag: tagFilter,
      favorite: favoriteFilter,
    },
  };
}

export type ExplorerFiltering = ReturnType<typeof useExplorerFiltering>;
