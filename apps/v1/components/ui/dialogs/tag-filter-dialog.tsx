"use client";

import { useMounted } from "@/hooks/use-mounted";
import { TagFilterMode } from "@/hooks/use-tag-filter";
import { Tag as TagType } from "@/lib/tag/types";
import { useTagFilterContext } from "@/providers/tag-filter-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, RotateCcw, Search, Tag, X } from "lucide-react";
import { useRef, useState } from "react";

const modeTexts = {
  AND: "すべて含む",
  OR: "いずれか",
  NOT: "含まない",
  EMPTY: "タグなし",
} as const;

export function TagFilterDialog() {
  const {
    query,
    setQuery,
    baseTags,
    searchedTags,
    isLoading,
    selectedTagIds,
    selectedTags,
    selectTags,
    mode,
    setMode,
  } = useTagFilterContext();

  const [open, setOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );
  // 選択済みタグのキャッシュ（ダイアログ内一時状態）
  const [tempSelectedCache, setTempSelectedCache] = useState<
    Map<string, TagType>
  >(new Map());
  const [tempMode, setTempMode] = useState<TagFilterMode>(mode);

  // サジェスト用
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isEmptyMode = tempMode === "EMPTY";
  const hasSelection = selectedTagIds.size > 0;
  const suggestionOpen = query.length > 0 && !isEmptyMode;

  // query なし → お気に入りタグのうち未選択のもの
  const favoriteTagsToShow = query
    ? []
    : baseTags.filter((t) => !tempSelectedIds.has(t.id));

  // query あり → 検索結果のうち未選択のもの（サジェスト候補）
  const suggestions = suggestionOpen
    ? searchedTags.filter((t) => !tempSelectedIds.has(t.id))
    : [];

  // ダイアログ内の選択済みタグ一覧（キャッシュから取得）
  const tempSelectedTags = [...tempSelectedCache.values()];

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // 現在のコンテキスト状態を一時状態に同期
      setTempSelectedIds(new Set(selectedTagIds));
      setTempSelectedCache(new Map(selectedTags.map((t) => [t.id, t])));
      setTempMode(mode);
      setQuery("");
    } else {
      setQuery("");
      setActiveIndex(-1);
    }
    setOpen(nextOpen);
  };

  const addToTemp = (tag: TagType) => {
    setTempSelectedIds((prev) => new Set(prev).add(tag.id));
    setTempSelectedCache((prev) => new Map(prev).set(tag.id, tag));
  };

  const removeFromTemp = (tag: TagType) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(tag.id);
      return next;
    });
    setTempSelectedCache((prev) => {
      const next = new Map(prev);
      next.delete(tag.id);
      return next;
    });
  };

  const handleSelectSuggestion = (tag: TagType) => {
    addToTemp(tag);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

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

  const handleClear = () => {
    setTempSelectedIds(new Set());
    setTempSelectedCache(new Map());
  };

  const handleApply = () => {
    if (tempMode === "EMPTY") {
      selectTags([]);
    } else {
      selectTags(tempSelectedTags);
    }
    setMode(tempMode);
    setOpen(false);
  };

  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="flex items-center">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 w-full transition-colors",
            hasSelection &&
              "border-primary bg-primary/5 text-primary hover:bg-primary/10",
            !hasSelection && "text-muted-foreground"
          )}
        >
          <Tag className="h-4 w-4" />
          <span>タグで絞り込む</span>
          {hasSelection && (
            <Badge
              variant="default"
              className="ml-1 px-1.5 h-5 min-w-[20px] justify-center"
            >
              {selectedTagIds.size}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className="sm:max-w-[450px] h-[550px] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            タグを選択
          </DialogTitle>
        </DialogHeader>

        {/* モード切り替え */}
        <div className="px-6 pb-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(["AND", "OR", "NOT", "EMPTY"] satisfies TagFilterMode[]).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setTempMode(m)}
                  className={cn(
                    "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                    tempMode === m
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {modeTexts[m]}
                </button>
              )
            )}
          </div>
        </div>

        {/* 検索ボックス + サジェストポップアップ */}
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="タグを検索して追加..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="pl-9 h-10 shadow-sm"
              disabled={isEmptyMode}
            />
            {isLoading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {/* サジェストポップアップ */}
            <AnimatePresence>
              {suggestionOpen && (
                <motion.div
                  key="tag-suggestions"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-[80] left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="max-h-[180px] overflow-y-auto p-1">
                    {isLoading ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        検索中...
                      </p>
                    ) : suggestions.length > 0 ? (
                      <>
                        <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          タグを選択して追加
                        </p>
                        {suggestions.map((tag, index) => {
                          const active = index === activeIndex;
                          return (
                            <button
                              key={tag.id}
                              ref={(el) => {
                                itemRefs.current[index] = el;
                              }}
                              type="button"
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => handleSelectSuggestion(tag)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between",
                                active ? "bg-accent" : "hover:bg-accent"
                              )}
                            >
                              <span>{tag.name}</span>
                              <Check
                                size={14}
                                className={cn(
                                  "text-primary transition-opacity",
                                  active ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        一致するタグが見つかりません
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* タグ一覧エリア */}
        <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto border-t border-b border-muted/50">
          {/* 選択済みタグ */}
          {tempSelectedTags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {tempSelectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="default"
                  className="cursor-pointer px-4 h-9 text-sm select-none border-transparent inline-flex items-center ring-2 ring-primary shadow-sm"
                  onClick={() => removeFromTemp(tag)}
                >
                  {tag.name}
                  <X className="ml-2 h-3.5 w-3.5" />
                </Badge>
              ))}
            </div>
          )}

          {/* セパレーター（両方ある場合のみ） */}
          {tempSelectedTags.length > 0 && favoriteTagsToShow.length > 0 && (
            <div className="border-t border-muted/50" />
          )}

          {/* お気に入りタグ（query なし・EMPTY モード以外） */}
          {favoriteTagsToShow.length > 0 && !isEmptyMode && (
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {favoriteTagsToShow.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer px-4 h-9 text-sm select-none border-transparent inline-flex items-center hover:bg-secondary/80"
                  onClick={() => addToTemp(tag)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* 何もない場合 */}
          {tempSelectedTags.length === 0 &&
            favoriteTagsToShow.length === 0 &&
            !isEmptyMode &&
            !query && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">上の検索バーからタグを追加できます</p>
              </div>
            )}
        </div>

        {/* 操作ボタン */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={tempSelectedTags.length === 0}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            選択を解除
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="px-8 shadow-md"
          >
            決定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
