"use client";

import { useTagFilterDialog } from "@/feature/filter/hooks/use-tag-filter-dialog";
import { TagFilterMode } from "@/lib/filter/types";
import { Tag as TagType } from "@/lib/tag/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ClockIcon,
  LinkIcon,
  Loader2Icon,
  RotateCcwIcon,
  SearchIcon,
  StarIcon,
  XIcon,
} from "lucide-react";

const modeTexts = {
  AND: "すべて含む",
  OR: "いずれか",
  NOT: "含まない",
  EMPTY: "タグなし",
} as const satisfies Record<TagFilterMode, string>;

interface TagFilterDialogProps {
  dialog: ReturnType<typeof useTagFilterDialog>;
  autoFocusInput?: boolean;
}

export function TagFilterDialog({
  dialog,
  autoFocusInput = false,
}: TagFilterDialogProps) {
  const {
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
    close,
    performApply,
    relatedTags,
    favoriteTags,
    recentTags,
  } = dialog;

  // const mounted = useMounted();
  // if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (autoFocusInput) inputRef.current?.focus();
        }}
        onEscapeKeyDown={(e) => e.stopPropagation()}
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
                  type="button"
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

        {/* 検索ボックス＋サジェスト */}
        <div className="px-6 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  if (autoFocusInput) inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
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
                    {suggestions.length > 0 ? (
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
                              <CheckIcon
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

        {/* 選択済みタグバッジ */}
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
                <XIcon className="h-3 w-3" />
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

        <div className="border-t border-muted/50 mx-6" />

        {/* サジェストタブグループ */}
        <div className="flex-1 overflow-hidden px-6 py-3">
          {!isEmptyMode && (
            <Tabs defaultValue="related" className="h-full flex flex-col">
              <TabsList className="w-full h-9 shrink-0">
                <TabsTrigger value="related" className="flex-1 gap-1.5 text-xs">
                  <LinkIcon className="size-3.5" />
                  関連
                </TabsTrigger>
                <TabsTrigger
                  value="favorite"
                  className="flex-1 gap-1.5 text-xs"
                >
                  <StarIcon className="size-3.5" />
                  お気に入り
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex-1 gap-1.5 text-xs">
                  <ClockIcon className="size-3.5" />
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

        {/* フッター */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={tempSelectedTags.length === 0}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <RotateCcwIcon className="mr-2 h-3.5 w-3.5" />
            選択を解除
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={performApply}
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
            {selected && <CheckIcon size={11} />}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
