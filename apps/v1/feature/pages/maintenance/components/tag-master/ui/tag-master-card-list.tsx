/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useTagMasterContext } from "@/feature/pages/maintenance/components/tag-master/providers/tag-master-provider";
import { TagDeleteButton } from "@/feature/pages/maintenance/components/tag-master/ui/tag-delete-button";
import { TagMediaPreview } from "@/feature/pages/maintenance/components/tag-master/ui/tag-media-preview";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, Edit2, Loader2, Star, X } from "lucide-react";
import * as React from "react";

export function TagMasterCardList() {
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
    estimateSize: () => 88, // カード高さ: p-3 + 2行 + gap + my-1 x2
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
    <div
      ref={parentRef}
      className="h-[300px] overflow-auto scrollbar-thin bg-background border sm:rounded-lg"
    >
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
              className="absolute w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={cn(
                  "mx-3 my-1 rounded-lg border bg-card p-3 flex flex-col gap-2"
                )}
              >
                {/* 1行目: 星 + タグ名/編集 + NEWバッジ + 操作ボタン */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-full",
                      tag.isFavorite
                        ? "text-yellow-500 hover:text-yellow-300"
                        : "text-muted-foreground/30 hover:text-yellow-500"
                    )}
                    onClick={() => toggleTagFavorite(tag)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        tag.isFavorite && "fill-current"
                      )}
                    />
                  </Button>

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
                      className="h-8 flex-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">{tag.name}</span>
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

                  {/* 操作ボタン */}
                  {editingId === tag.id ? (
                    <div className="flex gap-1 shrink-0">
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
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
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
                  )}
                </div>

                {/* 2行目: カナ + 使用数 */}
                <div className="flex items-center gap-3 pl-10">
                  {editingId === tag.id ? (
                    <Input
                      value={editValue.kana}
                      onChange={(e) =>
                        setEditValue({
                          ...editValue,
                          kana: e.target.value,
                        })
                      }
                      className="h-8 text-xs flex-1"
                      placeholder="カナ"
                    />
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {tag.kana || "---"}
                      </span>

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
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
