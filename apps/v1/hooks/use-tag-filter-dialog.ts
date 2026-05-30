import { useTags } from "@/hooks/use-tags";
import { TagFilterMode, TagFilterValue } from "@/lib/filter/types";
import { Tag } from "@/lib/tag/types";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type RelatedNode = {
  path: string;
  tags?: Tag[] | null;
};

interface UseTagFilterDialogProps {
  onApply?: (value: TagFilterValue) => void;
  autoFocusInput?: boolean;
}

export function useTagFilterDialog({
  onApply,
  autoFocusInput = false,
}: UseTagFilterDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [relatedTags, setRelatedTags] = useState<Tag[]>([]);

  // ダイアログ内の「一時編集状態」
  const [currentMode, setCurrentMode] = useState<TagFilterMode>("AND");
  const [query, setQuery] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [tempSelectedCache, setTempSelectedCache] = useState<Map<string, Tag>>(
    new Map()
  );
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const trimmedQuery = useMemo(() => query.trim().toLowerCase(), [query]);
  const [debouncedQuery] = useDebounce(trimmedQuery, 300);

  // ─── データフェッチ層（トリガー制御を含む） ───
  const isEmptyMode = currentMode === "EMPTY";
  const suggestionOpen = query.length > 0 && !isEmptyMode;

  const { tags: searchedTags, isLoading: isLoadingSearch } = useTags({
    query: debouncedQuery,
    triggered: isOpen && debouncedQuery === trimmedQuery && !!debouncedQuery,
  });

  const { tags: favoriteTags, isLoading: isLoadingFavorite } = useTags({
    strategy: "favorite-only",
    triggered: isOpen,
  });

  const { tags: recentTags, isLoading: isLoadingRecent } = useTags({
    strategy: "recently-used",
    limit: 10,
    triggered: isOpen,
  });

  const isLoading = isLoadingSearch || isLoadingFavorite || isLoadingRecent;

  // ダイアログ内の選択済みタグ一覧
  const tempSelectedTags = useMemo(
    () => [...tempSelectedCache.values()],
    [tempSelectedCache]
  );

  // サジェスト候補
  const suggestions = useMemo(() => {
    return suggestionOpen
      ? (searchedTags ?? []).filter((t) => !tempSelectedIds.has(t.id))
      : [];
  }, [suggestionOpen, searchedTags, tempSelectedIds]);

  // ─── 操作ロジック ───
  const open = useCallback(
    (initialValue: TagFilterValue, relatedNodes: RelatedNode[] = []) => {
      const initialIds = new Set(initialValue.tags.map((t) => t.id));

      const tagMap = new Map<string, Tag>();
      for (const node of relatedNodes) {
        if (node.tags == null || node.tags.length === 0) continue;
        for (const tag of node.tags) {
          tagMap.set(tag.id, tag);
        }
      }
      setRelatedTags([...tagMap.values()]);

      setCurrentMode(initialValue.mode);
      setTempSelectedIds(initialIds);
      setTempSelectedCache(new Map(initialValue.tags.map((t) => [t.id, t])));
      setQuery("");
      setActiveIndex(-1);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const toggleTemp = useCallback((tag: Tag) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.id)) next.delete(tag.id);
      else next.add(tag.id);
      return next;
    });
    setTempSelectedCache((prev) => {
      const next = new Map(prev);
      if (next.has(tag.id)) next.delete(tag.id);
      else next.set(tag.id, tag);
      return next;
    });
  }, []);

  const handleSelectSuggestion = useCallback(
    (tag: Tag) => {
      toggleTemp(tag);
      setQuery("");
      setActiveIndex(-1);
      if (autoFocusInput) inputRef.current?.focus();
    },
    [toggleTemp, autoFocusInput]
  );

  const handleClear = useCallback(() => {
    setTempSelectedIds(new Set());
    setTempSelectedCache(new Map());
  }, []);

  const performApply = useCallback(() => {
    onApply?.({
      mode: currentMode,
      tags: tempSelectedTags,
    });
    close();
  }, [currentMode, tempSelectedTags, onApply, close]);

  const scrollIntoView = (index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.min(prev + 1, suggestions.length - 1);
          scrollIntoView(next);
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          scrollIntoView(next);
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setQuery("");
        setActiveIndex(-1);
        break;
    }
  };

  return {
    isOpen,
    currentMode,
    query,
    tempSelectedIds,
    tempSelectedTags,
    suggestions,
    activeIndex,
    isLoading,
    suggestionOpen,
    isEmptyMode,
    inputRef,
    itemRefs,
    setQuery,
    setCurrentMode,
    setActiveIndex,
    toggleTemp,
    handleSelectSuggestion,
    handleKeyDown,
    handleClear,
    open,
    close,
    performApply,
    relatedTags: relatedTags ?? [],
    favoriteTags: favoriteTags ?? [],
    recentTags: recentTags ?? [],
  };
}
