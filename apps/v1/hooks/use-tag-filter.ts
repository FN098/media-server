"use client";

import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { SearchTagStrategy, SortTagStrategy, Tag } from "@/lib/tag/types";
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
    useState<SearchTagStrategy>("default");
  const [sortStrategy, setSortStrategy] = useState<SortTagStrategy>("default");

  const [activated, setActivated] = useState(false);
  const activate = useCallback(() => setActivated(true), []);

  const trimmedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const [debouncedQuery] = useDebounce(trimmedQuery, 300);

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );

  // TODO: クエリ検索以外にも triggered を設定して無駄なリクエストをなくす

  // ベースタグ：未使用のため停止
  const { tags: baseTags, isLoading: isLoadingBase } = useTags({
    paths: targetPaths,
    strategy: searchStrategy,
    triggered: false,
  });

  // クエリ検索タグ
  const { tags: searchedTags, isLoading: isLoadingSearch } = useTags({
    query: debouncedQuery,
    triggered: debouncedQuery === trimmedQuery && !!debouncedQuery,
  });

  // お気に入りタグ
  const { tags: favoriteTags, isLoading: isLoadingFavorite } = useTags({
    strategy: "favorite-only",
    triggered: activated,
  });

  // 最近使用タグ
  const { tags: recentTags, isLoading: isLoadingRecent } = useTags({
    strategy: "recently-used",
    limit: 10,
    triggered: activated,
  });

  // 関連タグ
  const { tags: relatedTags, isLoading: isLoadingRelated } = useTags({
    paths: targetPaths,
    strategy: "related-only",
    triggered: activated && targetPaths.length > 0,
  });

  const isLoading =
    isLoadingBase ||
    isLoadingSearch ||
    isLoadingFavorite ||
    isLoadingRecent ||
    isLoadingRelated;

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
    baseTags,
    searchedTags,
    favoriteTags,
    recentTags,
    relatedTags,
    isLoading,

    // 戦略
    searchStrategy,
    setSearchStrategy,
    sortStrategy,
    setSortStrategy,

    // ダイアログ初回オープン時に呼ぶ
    activate,
  };
}
