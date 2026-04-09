"use client";

import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { SearchTagStrategy, SortTagStrategy, Tag } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

export type TagFilterMode = "AND" | "OR" | "NOT" | "EMPTY";

export function useTagFilter(initialTargetNodes?: MediaNode[]) {
  const [targetNodes, setTargetNodes] = useState<MediaNode[]>(
    initialTargetNodes ?? []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [selectedTagCache, setSelectedTagCache] = useState<Map<string, Tag>>(
    new Map()
  );
  const [mode, setMode] = useState<TagFilterMode>("AND");
  const [query, setQuery] = useState("");
  const [searchStrategy, setSearchStrategy] =
    useState<SearchTagStrategy>("favorite-only");
  const [sortStrategy, setSortStrategy] = useState<SortTagStrategy>("default");

  const trimmedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const [debouncedQuery] = useDebounce(trimmedQuery, 300);

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );

  // ベースタグ（全件 or strategy 絞り込み）
  const { tags: baseTags, isLoading: isLoadingBase } = useTags({
    paths: targetPaths,
    strategy: searchStrategy,
  });

  // クエリ検索タグ
  const { tags: searchedTags, isLoading: isLoadingSearch } = useTags({
    query: debouncedQuery,
    triggered: debouncedQuery === trimmedQuery && !!debouncedQuery,
  });

  const isLoading = isLoadingBase || isLoadingSearch;

  // 表示用タグ（query があれば検索結果を優先、なければベース）
  const displayTags = useMemo(() => {
    const merged = trimmedQuery
      ? uniqueBy([...searchedTags, ...baseTags], "id")
      : baseTags;

    switch (sortStrategy) {
      case "by-name":
        return [...merged].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return merged;
    }
  }, [trimmedQuery, baseTags, searchedTags, sortStrategy]);

  const toggleTag = useCallback((tag: Tag) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.id)) {
        next.delete(tag.id);
        setSelectedTagCache((m) => {
          const n = new Map(m);
          n.delete(tag.id);
          return n;
        });
      } else {
        next.add(tag.id);
        setSelectedTagCache((m) => new Map(m).set(tag.id, tag));
      }
      return next;
    });
  }, []);

  const selectedTags = useMemo(
    () => [...selectedTagCache.values()],
    [selectedTagCache]
  );

  const selectedCount = selectedTags.length;

  const resetTags = useCallback(() => setSelectedTagIds(new Set()), []);

  const selectTags = useCallback((tags: Tag[]) => {
    setSelectedTagCache(new Map(tags.map((t) => [t.id, t])));
    setSelectedTagIds(new Set(tags.map((t) => t.id)));
  }, []);

  const isSelected = useCallback(
    (tag: Tag) => selectedTagIds.has(tag.id),
    [selectedTagIds]
  );

  return {
    // フィルター対象
    targetNodes,
    setTargetNodes,

    // フィルター状態
    selectedTags,
    selectedTagIds,
    selectedCount,
    isSelected,
    mode,
    setMode,

    // タグ操作
    toggleTag,
    resetTags,
    selectTags,

    // 検索・表示
    query,
    setQuery,
    displayTags,
    isLoading,

    // 戦略
    searchStrategy,
    setSearchStrategy,
    sortStrategy,
    setSortStrategy,
  };
}
