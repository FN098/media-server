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
import { Loader2, RotateCcw, Search, Tag, X } from "lucide-react";
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
    displayTags,
    isLoading,
    selectedTagIds,
    selectTags,
    mode,
    setMode,
  } = useTagFilterContext();

  // ダイアログ内の一時状態
  const [open, setOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [tempMode, setTempMode] = useState<TagFilterMode>(mode);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // ダイアログを開くとき: 現在のコンテキスト状態を一時状態に同期
      setTempSelectedIds(new Set(selectedTagIds));
      setTempMode(mode);
      setQuery("");
    }
    setOpen(nextOpen);
  };

  const handleToggleTemp = (tag: TagType) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.id)) {
        next.delete(tag.id);
      } else {
        next.add(tag.id);
      }
      return next;
    });
  };

  const handleClear = () => setTempSelectedIds(new Set());

  const handleApply = () => {
    const finalIds = tempMode === "EMPTY" ? new Set<string>() : tempSelectedIds;
    // displayTags から Tag オブジェクトを復元して Context に反映
    const finalTags = displayTags.filter((t) => finalIds.has(t.id));
    selectTags(finalTags);
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

  const isEmptyMode = tempMode === "EMPTY";
  const hasSelection = selectedTagIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 w-full transition-colors",
            hasSelection &&
              "border-primary bg-primary/5 text-primary hover:bg-primary/10"
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

        {/* 検索ボックス（サーバー検索） */}
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="タグを検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 shadow-sm"
            />
            {isLoading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* タグ一覧 */}
        <div className="flex-1 flex flex-wrap items-start content-start gap-x-2 gap-y-3 p-6 overflow-y-auto border-t border-b border-muted/50">
          {displayTags.length > 0 ? (
            displayTags.map((tag) => {
              const isTempSelected = tempSelectedIds.has(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isTempSelected ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer px-4 h-9 text-sm transition-all select-none border-transparent inline-flex items-center justify-center",
                    isTempSelected
                      ? "ring-2 ring-primary shadow-sm"
                      : "hover:bg-secondary/80",
                    isEmptyMode && "opacity-40 pointer-events-none"
                  )}
                  onClick={() => !isEmptyMode && handleToggleTemp(tag)}
                >
                  {tag.name}
                  {isTempSelected && <X className="ml-2 h-3.5 w-3.5" />}
                </Badge>
              );
            })
          ) : !isLoading ? (
            <div className="w-full text-center py-10 text-muted-foreground">
              <p>一致するタグが見つかりません</p>
            </div>
          ) : null}
        </div>

        {/* 操作ボタン */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={tempSelectedIds.size === 0}
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
