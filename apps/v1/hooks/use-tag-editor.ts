"use client";

import { useTagStates } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import {
  PendingChangesType,
  PendingNewTag,
  SearchTagStrategy,
  SortTagStrategy,
  Tag,
  TagOperator,
} from "@/lib/tag/types";
import { isMatchJapanese } from "@/lib/utils/search";
import { uniqueBy } from "@/lib/utils/unique";
import { useCallback, useMemo, useState } from "react";
import { v4 } from "uuid";

export function useTagEditor(initialTargetNodes?: MediaNode[]) {
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [targetNodes, setTargetNodes] = useState<MediaNode[]>(
    initialTargetNodes ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [pendingNewTags, setPendingNewTags] = useState<PendingNewTag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChangesType>({});
  const [searchStrategy, setSearchStrategy] =
    useState<SearchTagStrategy>("default");
  const [sortStrategy, setSortStrategy] = useState<SortTagStrategy>("default");

  const hasChanges = useMemo(
    () => Object.keys(pendingChanges).length > 0 || pendingNewTags.length > 0,
    [pendingChanges, pendingNewTags.length]
  );

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );

  // マスターデータ
  const {
    tags: masterTags,
    refreshTags,
    isLoading: isLoadingTags,
  } = useTags({
    paths: targetPaths,
    strategy: searchStrategy,
  });
  const tagStates = useTagStates(targetNodes, masterTags);

  // 編集用
  const editModeTags = useMemo(() => {
    const pendingAsTags: Tag[] = pendingNewTags.map((t) => ({
      id: t.tempId, // 仮ID
      name: t.name,
    }));

    const unique = uniqueBy([...masterTags, ...pendingAsTags], "id");

    switch (sortStrategy) {
      case "by-name":
        return unique.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return unique;
    }
  }, [masterTags, pendingNewTags, sortStrategy]);

  // 閲覧用
  const viewModeTags = useMemo(() => {
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

  // サジェスト用
  const suggestedTags = useMemo(() => {
    const query = newTagName.trim().toLowerCase();
    if (!query) return [];

    return masterTags.filter((tag) => {
      const isMatch = isMatchJapanese(tag.name, query);
      const isAlreadyApplied = tagStates[tag.name] === "all";
      const isPending = !!pendingChanges[tag.id];
      const isPendingNew = pendingNewTags.some((t) => t.name === tag.name);

      return isMatch && !isAlreadyApplied && !isPending && !isPendingNew;
    });
  }, [newTagName, masterTags, tagStates, pendingChanges, pendingNewTags]);

  const toggleTagChange = useCallback(
    (tag: Tag) => {
      const dbState = tagStates[tag.name] || "none";

      setPendingChanges((prev) => {
        const next = { ...prev };
        const current = prev[tag.id]; // "add" | "remove" | undefined

        let nextState: "add" | "remove" | undefined;

        if (dbState === "all") {
          // none <-> remove
          nextState = current === "remove" ? undefined : "remove";
        } else if (dbState === "none") {
          // none <-> add
          nextState = current === "add" ? undefined : "add";
        } else {
          // some: none -> add -> remove -> none
          if (current === undefined) nextState = "add";
          else if (current === "add") nextState = "remove";
          else nextState = undefined;
        }

        if (nextState === undefined) {
          delete next[tag.id];
        } else {
          next[tag.id] = nextState;
        }

        return next;
      });
    },
    [tagStates]
  );

  const setTagChange = useCallback((tag: Tag, op: TagOperator) => {
    setPendingChanges((prev) => {
      return { ...prev, [tag.id]: op };
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
    targetNodes,
    setTargetNodes,
    isTagEditMode,
    setIsTagEditMode,
    newTagName,
    setNewTagName,
    pendingNewTags,
    pendingChanges,
    hasChanges,
    setSearchStrategy,
    setSortStrategy,
    refreshTags,
    isLoadingTags,
    tagStates,
    editModeTags,
    viewModeTags,
    suggestedTags,
    toggleTagChange,
    setTagChange,
    resetChanges,
    addPendingNewTag,
    selectSuggestion,
  };
}
