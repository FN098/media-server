import { useTagStates } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import {
  PendingChangesType,
  PendingNewTag,
  SearchTagStrategy,
  SortTagStrategy,
  Tag,
  TagEditMode,
  TagOperator,
} from "@/lib/tag/types";
import { isMatchJapanese } from "@/lib/utils/search";
import { uniqueBy } from "@/lib/utils/unique";
import { useCallback, useMemo, useState } from "react";
import { v4 } from "uuid";

export function useTagEditor(initialTargetNodes?: MediaNode[]) {
  const [targetNodes, setTargetNodes] = useState<MediaNode[]>(
    initialTargetNodes ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingNewTags, setPendingNewTags] = useState<PendingNewTag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChangesType>({});
  const [isEditing, setIsEditing] = useState(false); // 編集・閲覧
  const [isActive, setIsActive] = useState(false); // 表示・非表示
  const [isTransparent, setIsTransparent] = useState(false); // 透明・非透明
  const [searchStrategy, setSearchStrategy] =
    useState<SearchTagStrategy>("recently-used");
  const [sortStrategy, setSortStrategy] = useState<SortTagStrategy>("default");
  const toggleIsTransparent = () => setIsTransparent((prev) => !prev);
  const toggleIsEditing = () => setIsEditing((prev) => !prev);
  const toggleIsActive = () => setIsActive((prev) => !prev);
  const isOpen = isActive;
  const isClose = !isActive;

  // モードの設定
  const mode: TagEditMode = useMemo(() => {
    if (isActive && targetNodes.length === 1) return "single";
    if (isActive && targetNodes.length > 1) return "default";
    return "none";
  }, [isActive, targetNodes.length]);

  // シングルモード時の対象パスを判定
  const singleTargetPath = useMemo(() => {
    if (mode !== "single") return null;
    return targetNodes[0]?.path ?? null;
  }, [mode, targetNodes]);

  // 変更件数
  const hasChanges =
    Object.keys(pendingChanges).length > 0 || pendingNewTags.length > 0;

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );

  // APIでマスタータグを取得
  const {
    tags: masterTags,
    refreshTags,
    isLoading: isLoadingTags,
  } = useTags({
    paths: targetPaths,
    strategy: searchStrategy,
  });

  // マスタータグ状態を計算
  const tagStates = useTagStates(targetNodes, masterTags);

  // 編集用タグ一覧
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

  // 閲覧用タグ一覧
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

  // タグ入力時サジェスト用タグ一覧
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

  // タグの追加・削除状態をトグル
  const toggleTagChange = useCallback(
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

  // タグの操作状態をセット
  const setTagChange = useCallback((tag: Tag, op: TagOperator) => {
    setPendingChanges((prev) => {
      return { ...prev, [tag.id]: op };
    });
  }, []);

  // すべての変更をリセット
  const resetChanges = useCallback(() => {
    setPendingChanges({});
    setPendingNewTags([]);
  }, []);

  // 新規タグを追加（DBにはまだ登録しない）
  const addPendingNewTag = useCallback((name: string) => {
    setPendingNewTags((prev) => {
      if (prev.some((t) => t.name === name)) return prev;
      return [...prev, { tempId: v4(), name }];
    });
  }, []);

  // タグを追加（DBにはまだ登録しない）
  const addTagByName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const existing = editModeTags.find((t) => t.name === trimmed);
      if (existing) {
        // 既に存在すれば「追加候補」
        setTagChange(existing, "add");
      } else {
        // 仮タグとしてメモリに積む
        addPendingNewTag(trimmed);
      }
      setNewTagName("");
    },
    [addPendingNewTag, editModeTags, setTagChange]
  );

  // サジェスト候補の選択処理
  const selectSuggestion = useCallback(
    (tag: Tag) => {
      setTagChange(tag, "add");
      setNewTagName("");
    },
    [setTagChange]
  );

  // エディタを開く
  const openEditor = useCallback(() => {
    setIsActive(true);
  }, []);

  // エディタを閉じる
  const closeEditor = useCallback(() => {
    setIsActive(false);
  }, []);

  // エディタを開く/閉じる
  const toggleEditorOpenClose = useCallback(() => {
    toggleIsActive();
  }, []);

  // タグ編集セッション終了
  const endSession = useCallback(() => {
    setIsEditing(false);
    setIsActive(false);
    resetChanges();
  }, [resetChanges]);

  return {
    targetNodes,
    setTargetNodes,
    singleTargetPath,
    targetPaths,
    masterTags,
    editModeTags,
    viewModeTags,
    mode,
    newTagName,
    setNewTagName,
    isActive,
    setIsActive,
    isLoading,
    setIsLoading,
    isLoadingTags,
    tagStates,
    pendingChanges,
    setPendingChanges,
    hasChanges,
    isEditing,
    setIsEditing,
    setTagChange,
    resetChanges,
    refreshTags,
    suggestedTags,
    selectSuggestion,
    pendingNewTags,
    setPendingNewTags,
    addPendingNewTag,
    isTransparent,
    setIsTransparent,
    toggleIsTransparent,
    toggleTagChange,
    searchStrategy,
    setSearchStrategy,
    sortStrategy,
    setSortStrategy,
    addTagByName,
    endSession,
    isOpen,
    isClose,
    openEditor,
    closeEditor,
    toggleEditorOpenClose,
    toggleIsEditing,
    toggleIsActive,
  };
}
