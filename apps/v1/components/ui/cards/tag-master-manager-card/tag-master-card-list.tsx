/* eslint-disable react-hooks/incompatible-library */
"use client";

import { TagDeleteButton } from "@/components/ui/buttons/tag-delete-button";
import { TagMediaPreview } from "@/components/ui/cards/tag-master-manager-card/tag-media-preview";
import { TagMasterItem } from "@/lib/tag/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, Edit2, Loader2, Star, X } from "lucide-react";
import * as React from "react";

interface TagMasterCardListProps {
  tags: TagMasterItem[];
  editingId: string | null;
  editValue: { name: string; kana: string };
  isUpdating: boolean;
  isDeleting: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isMarking: boolean;
  onToggleFavorite: (current: { id: string; isFavorite: boolean }) => void;
  onStartEdit: (tag: TagMasterItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: { name: string; kana: string }) => void;
  onDelete: (id: string) => void;
  onFetchNext: () => void;
  onMarkAsRead: (id: string) => void;
}

export function TagMasterCardList({
  tags,
  editingId,
  editValue,
  isUpdating,
  isDeleting,
  hasNextPage,
  isFetchingNextPage,
  isMarking,
  onToggleFavorite,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onDelete,
  onFetchNext,
  onMarkAsRead,
}: TagMasterCardListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? tags.length + 1 : tags.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // カード高さ: p-3 + 2行 + gap + my-1 x2
    overscan: 10,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1);
      if (!lastItem) return;
      if (
        lastItem.index >= tags.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        onFetchNext();
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
          const tag = tags[virtualRow.index];
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
                    onClick={() => onToggleFavorite(tag)}
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
                        onEditValueChange({
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
                            onMarkAsRead(tag.id);
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
                        onClick={() => onSaveEdit(tag.id)}
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
                        onClick={onCancelEdit}
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
                        onClick={() => onStartEdit(tag)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <TagDeleteButton
                        tagName={tag.name}
                        mediaCount={tag.relatedMediaCount}
                        onDelete={() => onDelete(tag.id)}
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
                        onEditValueChange({
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
