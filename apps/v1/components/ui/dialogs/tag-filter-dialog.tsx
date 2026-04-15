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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  Link,
  Loader2,
  RotateCcw,
  Search,
  Star,
  Tag,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

interface TagFilterDialogProps {
  autoFocusInput?: boolean;
}

const modeTexts = {
  AND: "すべて含む",
  OR: "いずれか",
  NOT: "含まない",
  EMPTY: "タグなし",
} as const;

export function TagFilterDialog({
  autoFocusInput = false,
}: TagFilterDialogProps) {
  const {
    query,
    setQuery,
    searchedTags,
    favoriteTags,
    relatedTags,
    recentTags,
    isLoading,
    selectedTagIds,
    selectedTags,
    selectTags,
    mode,
    setMode,
    activate,
  } = useTagFilterContext({ suppressError: false });

  const [open, setOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );
  // 選択済みタグのキャッシュ（ダイアログ内一時状態）
  const [tempSelectedCache, setTempSelectedCache] = useState<
    Map<string, TagType>
  >(new Map());
  const [currentMode, setCurrentMode] = useState<TagFilterMode>(mode);

  // サジェスト用
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isEmptyMode = currentMode === "EMPTY";
  const hasSelection = selectedTagIds.size > 0;
  const suggestionOpen = query.length > 0 && !isEmptyMode;

  // ダイアログ内の選択済みタグ一覧（キャッシュから取得）
  const tempSelectedTags = [...tempSelectedCache.values()];

  // サジェスト候補（選択済みは除外）
  const suggestions = suggestionOpen
    ? searchedTags.filter((t) => !tempSelectedIds.has(t.id))
    : [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      activate();
      // 現在のコンテキスト状態を一時状態に同期
      setTempSelectedIds(new Set(selectedTagIds));
      setTempSelectedCache(new Map(selectedTags.map((t) => [t.id, t])));
      setCurrentMode(mode);
      setQuery("");
    } else {
      setQuery("");
      setActiveIndex(-1);
    }
    setOpen(nextOpen);
  };

  const toggleTemp = (tag: TagType) => {
    if (tempSelectedIds.has(tag.id)) {
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
    } else {
      setTempSelectedIds((prev) => new Set(prev).add(tag.id));
      setTempSelectedCache((prev) => new Map(prev).set(tag.id, tag));
    }
  };

  const handleSelectSuggestion = (tag: TagType) => {
    toggleTemp(tag);
    setQuery("");
    setActiveIndex(-1);
    if (autoFocusInput) inputRef.current?.focus();
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
    if (currentMode === "EMPTY") {
      selectTags([]);
    } else {
      selectTags(tempSelectedTags);
    }
    setMode(currentMode);
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
          onPointerEnter={activate}
          onPointerDown={activate}
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
          if (autoFocusInput) inputRef.current?.focus();
        }}
        className="sm:max-w-[450px] h-[580px] flex flex-col p-0 overflow-hidden"
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
                  onClick={() => setCurrentMode(m)}
                  className={cn(
                    "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                    currentMode === m
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

        {/* 検索ボックス＋サジェストポップアップ */}
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
                  if (autoFocusInput) inputRef.current?.focus();
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

        {/* 選択済みタグ */}
        {tempSelectedTags.length > 0 ? (
          <div className="px-6 pb-2 flex flex-wrap gap-1.5 min-h-[40px]">
            {tempSelectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="default"
                className="cursor-pointer px-3 h-7 text-xs select-none inline-flex items-center gap-1.5 ring-2 ring-primary shadow-sm"
                onClick={() => toggleTemp(tag)}
              >
                {tag.name}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        ) : currentMode !== "EMPTY" ? (
          <div className="px-6 pb-2 flex justify-center gap-1.5 min-h-[40px]">
            <p className="text-xs text-muted-foreground italic self-center select-none">
              タグを検索するか下から選択してください
            </p>
          </div>
        ) : null}

        {/* 仕切り */}
        <div className="border-t border-muted/50 mx-6" />

        {/* タブ候補エリア */}
        <div className="flex-1 overflow-hidden px-6 py-3">
          {!isEmptyMode && (
            <Tabs defaultValue="related" className="h-full flex flex-col">
              <TabsList className="w-full h-9 shrink-0">
                <TabsTrigger value="related" className="flex-1 gap-1.5 text-xs">
                  <Link className="size-3.5" />
                  関連
                </TabsTrigger>
                <TabsTrigger
                  value="favorite"
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Star className="size-3.5" />
                  お気に入り
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex-1 gap-1.5 text-xs">
                  <Clock className="size-3.5" />
                  最近使用
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-2">
                <TabsContent
                  value="related"
                  className="h-full overflow-y-auto mt-0 outline-none"
                >
                  <TagChipList
                    tags={relatedTags}
                    selectedIds={tempSelectedIds}
                    onToggle={toggleTemp}
                    emptyMessage="関連タグがありません"
                  />
                </TabsContent>
                <TabsContent
                  value="favorite"
                  className="h-full overflow-y-auto mt-0 outline-none"
                >
                  <TagChipList
                    tags={favoriteTags}
                    selectedIds={tempSelectedIds}
                    onToggle={toggleTemp}
                    emptyMessage="お気に入りタグがありません"
                  />
                </TabsContent>
                <TabsContent
                  value="recent"
                  className="h-full overflow-y-auto mt-0 outline-none"
                >
                  <TagChipList
                    tags={recentTags}
                    selectedIds={tempSelectedIds}
                    onToggle={toggleTemp}
                    emptyMessage="最近使用したタグがありません"
                  />
                </TabsContent>
              </div>
            </Tabs>
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

/* ---- 共通タグチップリスト ---- */

interface TagChipListProps {
  tags: TagType[];
  selectedIds: Set<string>;
  onToggle: (tag: TagType) => void;
  emptyMessage?: string;
}

function TagChipList({
  tags,
  selectedIds,
  onToggle,
  emptyMessage = "タグがありません",
}: TagChipListProps) {
  if (tags.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 text-center italic">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 py-1">
      {tags.map((tag) => {
        const selected = selectedIds.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium transition-all active:scale-95",
              selected
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {selected && <Check size={11} />}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
