"use client";

import { useTags } from "@/hooks/use-tags";
import { MediaTypeFilterValue, RatingFilterInput } from "@/lib/filter/types";
import {
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { unique } from "@/lib/utils/array";
import { useTagFilterContext } from "@/providers/tag-filter-provider";
import { useCallback, useMemo, useState } from "react";

export function useFilters({
  allNodes,
  query,
  activated: initialActivated = false,
}: {
  allNodes: MediaNode[];
  query: string;
  activated: boolean;
}) {
  // タグフィルタ
  const tagFilterContext = useTagFilterContext({ suppressError: true });

  // context がない場合のフォールバック（Null Object Pattern）
  const tagFilter = useMemo(() => {
    if (tagFilterContext) return tagFilterContext;

    return {
      selectedTags: [],
      selectedCount: 0,
      mode: "AND" as const,
      selectTags: () => {},
      setMode: () => {},
    };
  }, [tagFilterContext]);

  // タグフィルタにタグを追加
  const [pathsToAddTagFilter, setPathsToAddTagFilter] = useState<string[]>([]);

  // タグをフィルタに追加
  const addTagFilter = useCallback(
    (node: MediaNode) =>
      setPathsToAddTagFilter((prev) => unique([...prev, node.path])),
    []
  );

  // タグ検索
  useTags({
    strategy: "related-only",
    paths: pathsToAddTagFilter,
    triggered: pathsToAddTagFilter.length > 0,
    onSuccess: (tags) => {
      if (tags.length > 0) tagFilter.selectTags(tags);
    },
  });

  // レーティングフィルタ
  const [ratingFilter, setRatingFilter] = useState<RatingFilterInput>({
    mode: "all",
  });

  // 種類フィルタ
  const [mediaTypeFilterValue, setMediaTypeFilterValue] =
    useState<MediaTypeFilterValue>("all");

  // フィルタリセット
  const resetFilters = useCallback(() => {
    tagFilter.selectTags([]);
    tagFilter.setMode("AND");
    setRatingFilter({ mode: "all" });
    setMediaTypeFilterValue("all");
  }, [tagFilter]);

  // フィルターが一つでも適用されているかチェック
  const isFiltered =
    tagFilter.selectedCount > 0 ||
    tagFilter.mode !== "AND" ||
    ratingFilter.mode !== "all" ||
    mediaTypeFilterValue !== "all";

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);
  const tagFilterFn = useMemo(
    () =>
      createTagFilter(
        tagFilter.selectedTags.map((t) => t.name),
        tagFilter.mode
      ),
    [tagFilter]
  );
  const ratingFilterFn = useMemo(
    () => createRatingFilter(ratingFilter),
    [ratingFilter]
  );
  const mediaTypeFilterFn = useMemo(
    () => createMediaTypeFilter(mediaTypeFilterValue),
    [mediaTypeFilterValue]
  );

  // フィルター有効化
  const [activated, setActivated] = useState(initialActivated);
  const activate = useCallback(() => setActivated(true), []);

  // フィルタリング実行
  const filteredNodes = useMemo(() => {
    if (!activated) return allNodes;

    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      mediaTypeFilterFn,
      ratingFilterFn,
      searchFilterFn,
      tagFilterFn,
    ];

    // フィルタの適用
    return allNodes.filter((node) => {
      return filters.every((fn) => fn(node));
    });
  }, [
    activated,
    allNodes,
    mediaTypeFilterFn,
    ratingFilterFn,
    searchFilterFn,
    tagFilterFn,
  ]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  return {
    // フィルター状態
    mediaTypeFilterValue,
    setMediaTypeFilterValue,
    ratingFilter,
    setRatingFilter,

    // フィルター結果
    filteredNodes,
    mediaOnly,
    isFiltered,

    // フィルター操作
    addTagFilter,
    resetFilters,
    activate,
  };
}
