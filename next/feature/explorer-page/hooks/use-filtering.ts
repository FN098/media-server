import { useFavoriteFilter } from "@/feature/favorite/hooks/use-favorite-filter";
import { createFavoriteFilter } from "@/feature/favorite/lib/filter";
import { useFileTypeFilter } from "@/feature/file/hooks/use-file-type-filter";
import {
  createFileTypeFilter,
  createMediaOnlyFilter,
} from "@/feature/file/lib/filter";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";
import { useResetSearchParams } from "@/feature/search-params/hooks/use-reset-search-params";
import { useQueryFilter } from "@/feature/search/hooks/use-query-filter";
import { createQueryFilter } from "@/feature/search/lib/filter";
import { useTagFilter } from "@/feature/tag/hooks/use-tag-filter";
import { createTagFilter } from "@/feature/tag/lib/filter";
import { Node } from "@/lib/node/types";
import { useCallback, useMemo } from "react";

const applyFilters = <T>(array: T[], filters: ((item: T) => boolean)[]) => {
  return array.filter((item) => filters.every((filter) => filter(item)));
};

export function useFiltering() {
  const { children: nodes } = useNodeListingContext();
  const queryFilter = useQueryFilter();
  const fileTypeFilter = useFileTypeFilter();
  const tagFilter = useTagFilter();
  const favoriteFilter = useFavoriteFilter();

  const filters = useMemo(
    () => [
      createQueryFilter(queryFilter.value),
      createFileTypeFilter(fileTypeFilter.value),
      createTagFilter(tagFilter.value),
      createFavoriteFilter(favoriteFilter.value),
    ],
    [
      queryFilter.value,
      fileTypeFilter.value,
      tagFilter.value,
      favoriteFilter.value,
    ]
  );

  const filteredNodes = useMemo(() => applyFilters(nodes, filters), []);
  const filteredCount = filteredNodes.length;
  const totalCount = nodes.length;
  const isFiltered = totalCount !== filteredCount;

  // メディアのみ
  const mediaOnlyFilter = useMemo(() => createMediaOnlyFilter(), []);
  const mediaOnly = useMemo(() => applyFilters(nodes, [mediaOnlyFilter]), []);

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
  const search = useResetSearchParams({
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
      mediaType: fileTypeFilter,
      tag: tagFilter,
      favorite: favoriteFilter,
    },
  };
}

export type ExplorerFiltering = ReturnType<typeof useFiltering>;
