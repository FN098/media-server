"use client";

import { useTagStates } from "@/hooks/use-tag-states";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import {
  PendingChanges,
  SearchTagStrategy,
  SortTagStrategy,
  Tag,
  TagOperator,
} from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/array";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { v4 } from "uuid";

export function useTagEditor(initialTargetNodes?: MediaNode[]) {
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [targetNodes, setTargetNodes] = useState<MediaNode[]>(
    initialTargetNodes ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [pendingNewTags, setPendingNewTags] = useState<Tag[]>([]);
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

  const allTags = useMemo(
    () => [...masterTags, ...pendingNewTags],
    [masterTags, pendingNewTags]
  );

  const tagStates = useTagStates(targetNodes, allTags);

  // 編集タグ
  const editModeTags = useMemo(() => {
    const pendingNewAsTags: Tag[] = pendingNewTags.map((t) => ({
      id: t.id, // 仮ID
      name: t.name,
    }));

    const combined = uniqueBy(
      [...pendingNewAsTags, ...pendingChangeTags, ...masterTags],
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

  // タグ変更状態トグル
  const toggleTagChange = useCallback(
    (tag: Tag) => {
      setPendingChanges((prev) => {
        const next = { ...prev };
        const currentOp = prev[tag.id]; // "add" | "remove" | undefined

        const nextOp = (() => {
          const tagState = tagStates[tag.name] || "none";
          switch (tagState) {
            case "all":
              // none <-> remove
              return currentOp === "remove" ? undefined : "remove";

            case "none":
              // none <-> remove
              return currentOp === "remove" ? undefined : "remove";

            case "some":
              // some: none -> add -> remove -> none
              if (currentOp === undefined) return "add";
              else if (currentOp === "add") return "remove";
              else return undefined;
          }
        })();

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

  // タグ変更バッファ更新
  const setTagChange = useCallback((tag: Tag, operator: TagOperator) => {
    setPendingChanges((prev) => {
      return { ...prev, [tag.id]: operator };
    });
    setPendingChangeTags((prev) => {
      return [...prev, { ...tag }];
    });
  }, []);

  // すべての変更をリセット
  const resetChanges = useCallback(() => {
    setPendingChanges({});
    setPendingNewTags([]);
  }, []);

  // 新規タグ追加
  const addPendingNewTag = useCallback((name: string) => {
    setPendingNewTags((prev) => {
      if (prev.some((t) => t.name === name)) return prev;
      return [...prev, { id: v4(), name }];
    });
  }, []);

  // サジェスト候補選択
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
