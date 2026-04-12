"use client";

import { useTagStates } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import {
  PendingChanges,
  PendingNewTag,
  SearchTagStrategy,
  SortTagStrategy,
  Tag,
  TagOperator,
} from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { v4 } from "uuid";

export function useTagEditor(initialTargetNodes?: MediaNode[]) {
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [targetNodes, setTargetNodes] = useState<MediaNode[]>(
    initialTargetNodes ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [pendingNewTags, setPendingNewTags] = useState<PendingNewTag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [pendingChangeTags, setPendingChangeTags] = useState<Tag[]>([]);
  const [searchStrategy, setSearchStrategy] =
    useState<SearchTagStrategy>("default");
  const [sortStrategy, setSortStrategy] = useState<SortTagStrategy>("default");
  const [opacity, setOpacity] = useState<number>(0);
  const query = useMemo(() => newTagName.trim().toLowerCase(), [newTagName]);
  const [debouncedQuery] = useDebounce(query, 300);

  const hasChanges = useMemo(
    () => Object.keys(pendingChanges).length > 0 || pendingNewTags.length > 0,
    [pendingChanges, pendingNewTags.length]
  );

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );

  // ベースタグ（全件 or strategy 絞り込み）
  const {
    tags: baseTags,
    refreshTags,
    invalidateTags,
    isLoading: isLoadingBase,
  } = useTags({
    paths: targetPaths,
    strategy: searchStrategy,
  });

  // クエリ検索タグ
  const { tags: searchedTags, isLoading: isLoadingSearch } = useTags({
    query: debouncedQuery,
    triggered: debouncedQuery === query,
  });

  // お気に入りタグ
  const { tags: favoriteTags, isLoading: isLoadingFavorite } = useTags({
    strategy: "favorite-only",
  });

  // 最近使用タグ
  const { tags: recentTags, isLoading: isLoadingRecent } = useTags({
    strategy: "recently-used",
    limit: 10,
  });

  // マスタータグ
  const masterTags = useMemo(() => {
    return uniqueBy([...baseTags, ...searchedTags], "id");
  }, [baseTags, searchedTags]);

  const isLoadingTags =
    isLoadingBase || isLoadingSearch || isLoadingFavorite || isLoadingRecent;

  const tagStates = useTagStates(targetNodes, masterTags);

  // 編集タグ
  const editModeTags = useMemo(() => {
    const pendingNewAsTags: Tag[] = pendingNewTags.map((t) => ({
      id: t.tempId, // 仮ID
      name: t.name,
    }));

    const combined = uniqueBy(
      [...masterTags, ...pendingNewAsTags, ...pendingChangeTags],
      "id"
    );

    switch (sortStrategy) {
      case "by-name":
        return combined.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return combined;
    }
  }, [pendingNewTags, pendingChangeTags, masterTags, sortStrategy]);

  // 関連タグ
  const relatedTags = useMemo(() => {
    const relatedTags = masterTags.filter(
      (tag) => tagStates[tag.name] === "some" || tagStates[tag.name] === "all"
    );

    switch (sortStrategy) {
      case "by-name":
        return relatedTags.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return relatedTags;
    }
  }, [masterTags, sortStrategy, tagStates]);

  // サジェストタグ
  const suggestedTags = useMemo(() => {
    if (!query) return [];

    return searchedTags.filter((tag) => {
      const isAlreadyApplied = tagStates[tag.name] === "all";
      const isPending = !!pendingChanges[tag.id];
      const isPendingNew = pendingNewTags.some((t) => t.name === tag.name);

      return !isAlreadyApplied && !isPending && !isPendingNew;
    });
  }, [query, searchedTags, tagStates, pendingChanges, pendingNewTags]);

  const toggleTagChange = useCallback(
    (tag: Tag) => {
      const dbState = tagStates[tag.name] || "none";

      setPendingChanges((prev) => {
        const next = { ...prev };
        const current = prev[tag.id]; // "add" | "remove" | undefined

        let nextOp: "add" | "remove" | undefined;

        if (dbState === "all") {
          // none <-> remove
          nextOp = current === "remove" ? undefined : "remove";
        } else if (dbState === "none") {
          // none <-> add
          nextOp = current === "add" ? undefined : "add";
        } else {
          // some: none -> add -> remove -> none
          if (current === undefined) nextOp = "add";
          else if (current === "add") nextOp = "remove";
          else nextOp = undefined;
        }

        if (nextOp === undefined) {
          delete next[tag.id];
        } else {
          next[tag.id] = nextOp;
        }

        return next;
      });
    },
    [tagStates]
  );

  const setTagChange = useCallback((tag: Tag, operator: TagOperator) => {
    setPendingChanges((prev) => {
      return { ...prev, [tag.id]: operator };
    });
    setPendingChangeTags((prev) => {
      return [...prev, { ...tag }];
    });
  }, []);

  const resetChanges = useCallback(() => {
    setPendingChanges({});
    setPendingNewTags([]);
  }, []);

  const addPendingNewTag = useCallback((name: string) => {
    setPendingNewTags((prev) => {
      if (prev.some((t) => t.name === name)) return prev;
      return [...prev, { tempId: v4(), name }];
    });
  }, []);

  const selectSuggestion = useCallback(
    (tag: Tag) => {
      setTagChange(tag, "add");
      setNewTagName("");
    },
    [setTagChange]
  );

  return {
    // 編集対象
    targetNodes,
    setTargetNodes,

    // 編集状態
    isTagEditMode,
    setIsTagEditMode,
    newTagName,
    setNewTagName,
    pendingNewTags,
    pendingChanges,
    hasChanges,
    tagStates,

    // タグ操作
    toggleTagChange,
    setTagChange,
    selectSuggestion,
    addPendingNewTag,
    resetChanges,

    // 検索・表示
    opacity,
    setOpacity,
    invalidateTags,
    refreshTags,
    editModeTags,
    relatedTags,
    suggestedTags,
    favoriteTags,
    recentTags,
    isLoadingTags,

    // 戦略
    searchStrategy,
    setSearchStrategy,
    sortStrategy,
    setSortStrategy,
  };
}
