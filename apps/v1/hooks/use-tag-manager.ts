import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { PendingNewTag, Tag, TagEditMode, TagOperator } from "@/lib/tag/types";
import { isMatchJapanese } from "@/lib/utils/search";
import { uniqueBy } from "@/lib/utils/unique";
import { useCallback, useMemo, useState } from "react";

export function useTagManager(
  targetNodes: MediaNode[],
  initialMode: TagEditMode
) {
  const [mode, setMode] = useState(initialMode);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingNewTags, setPendingNewTags] = useState<PendingNewTag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, TagOperator>
  >({});
  const [isEditing, setIsEditing] = useState(false);

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
  } = useTags(targetPaths);
  const { tagStates } = useTagSelection(targetNodes, masterTags);

  // 編集用
  const editModeTags = useMemo(() => {
    const pendingAsTags: Tag[] = pendingNewTags.map((t) => ({
      id: t.tempId, // 仮ID
      name: t.name,
    }));

    return uniqueBy([...masterTags, ...pendingAsTags], "id").sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [masterTags, pendingNewTags]);

  // 閲覧用
  const viewModeTags = masterTags.filter(
    (tag) => tagStates[tag.name] === "all"
  );

  const hasChanges =
    Object.keys(pendingChanges).length > 0 || pendingNewTags.length > 0;

  // タグ入力時サジェスト
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

  const toggleTag = useCallback(
    (tag: Tag) => {
      const dbState = tagStates[tag.name] || "none";
      setPendingChanges((prev) => {
        const next = { ...prev };
        if (prev[tag.id]) {
          delete next[tag.id];
        } else {
          // 「既に全員が持っている」なら「削除候補」、「それ以外」なら「追加候補」
          next[tag.id] = dbState === "all" ? "remove" : "add";
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
      return [...prev, { tempId: crypto.randomUUID(), name }];
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
    targetPaths,
    masterTags,
    editModeTags,
    viewModeTags,
    mode,
    setMode,
    newTagName,
    setNewTagName,
    isLoading,
    setIsLoading,
    isLoadingTags,
    tagStates,
    pendingChanges,
    setPendingChanges,
    hasChanges,
    isEditing,
    setIsEditing,
    toggleTag,
    setTagChange,
    resetChanges,
    refreshTags,
    suggestedTags,
    selectSuggestion,
    pendingNewTags,
    setPendingNewTags,
    addPendingNewTag,
  };
}
