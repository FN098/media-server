/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useTagMasterContext } from "@/feature/tag-master/providers/tag-master-provider";
import { TagDeleteButton } from "@/feature/tag-master/ui/tag-delete-button";
import { TagMediaPreview } from "@/feature/tag-master/ui/tag-media-preview";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, Edit2, Loader2, Star, X } from "lucide-react";
import * as React from "react";

const GRID_COLS = "grid-cols-[80px_1fr_25%_100px_120px]";

export function TagMasterTable() {
  const {
    hasNextPage,
    allTags,
    isFetchingNextPage,
    fetchNextPage,
    editingId,
    toggleTagFavorite,
    editValue,
    setEditValue,
    markAsRead,
    isMarking,
    saveChanges,
    isUpdating,
    cancelEdit,
    startEdit,
    deleteTag,
    isDeleting,
  } = useTagMasterContext();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allTags.length + 1 : allTags.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1);
      if (!lastItem) return;
      if (
        lastItem.index >= allTags.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
  });

  return (
    <div className="border sm:rounded-lg overflow-hidden bg-background">
      {/* ヘッダー */}
      <div
        className={cn(
          "grid",
          GRID_COLS,
          "pr-4 py-2 bg-muted/90 backdrop-blur-sm text-sm font-medium text-muted-foreground border-b sticky top-0 z-30"
        )}
      >
        <div className="text-center">固定</div>
        <div>タグ名</div>
        <div>カナ</div>
        <div>使用数</div>
        <div className="text-right pr-2">操作</div>
      </div>

      {/* スクロールコンテナ */}
      <div ref={parentRef} className="h-[300px] overflow-auto scrollbar-thin">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const tag = allTags[virtualRow.index];
            if (!tag) return null;
            return (
              <div
                key={virtualRow.key}
                className={cn(
                  "grid absolute w-full border-b items-center hover:bg-muted/40 group transition-colors",
                  GRID_COLS
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* お気に入り */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full",
                      tag.isFavorite
                        ? "text-yellow-500 hover:text-yellow-300"
                        : "text-muted-foreground/30 hover:text-yellow-500"
                    )}
                    onClick={() => toggleTagFavorite(tag)}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        tag.isFavorite && "fill-current"
                      )}
                    />
                  </Button>
                </div>

                {/* タグ名 */}
                <div className="overflow-hidden">
                  {editingId === tag.id ? (
                    <Input
                      autoFocus
                      value={editValue.name}
                      onChange={(e) =>
                        setEditValue({
                          ...editValue,
                          name: e.target.value,
                        })
                      }
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate" title={tag.name}>
                        {tag.name}
                      </span>
                      {tag.isNew && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 行のクリックイベントなどがあれば伝播を防止
                            markAsRead([tag.id]);
                          }}
                          disabled={isMarking}
                          className="group/new-badge relative inline-flex"
                        >
                          <Badge
                            className={cn(
                              "bg-yellow-400 hover:bg-yellow-500 text-black text-[10px] px-1.5 py-0 h-5 border-none transition-all cursor-pointer flex items-center gap-1",
                              isMarking && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {/* 通常時：NEWを表示 */}
                            <span className="group-hover/new-badge:hidden">
                              NEW
                            </span>

                            {/* ホバー時：既読アイコンとテキストを表示 */}
                            <span className="hidden group-hover/new-badge:flex items-center gap-0.5">
                              {isMarking ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  既読にする
                                </>
                              )}
                            </span>
                          </Badge>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* カナ */}
                <div>
                  {editingId === tag.id ? (
                    <Input
                      value={editValue.kana}
                      onChange={(e) =>
                        setEditValue({
                          ...editValue,
                          kana: e.target.value,
                        })
                      }
                      className="h-9 text-xs"
                    />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground truncate block"
                      title={tag.kana ?? "-"}
                    >
                      {tag.kana || "-"}
                    </span>
                  )}
                </div>

                {/* 使用数 */}
                <div>
                  <TagMediaPreview
                    tagId={tag.id}
                    tagName={tag.name}
                    count={tag.relatedMediaCount}
                  >
                    <button
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-mono bg-muted/30 transition-colors",
                        tag.relatedMediaCount > 0
                          ? "hover:bg-primary/10 hover:border-primary/30 cursor-pointer"
                          : "opacity-50 cursor-default"
                      )}
                      disabled={tag.relatedMediaCount === 0}
                    >
                      {tag.relatedMediaCount.toLocaleString()}
                    </button>
                  </TagMediaPreview>
                </div>

                {/* 操作 */}
                <div className="flex justify-end">
                  {editingId === tag.id ? (
                    // 編集中の行：保存・キャンセルボタンを表示
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                        onClick={() => saveChanges(tag.id)}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-red-50"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // 非編集中の行：
                    // 他の行が編集中の場合（editingId !== null）は何も表示しない
                    !editingId && (
                      <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => startEdit(tag)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <TagDeleteButton
                          tagName={tag.name}
                          mediaCount={tag.relatedMediaCount}
                          onDelete={() => deleteTag(tag.id)}
                          isDeleting={isDeleting}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
