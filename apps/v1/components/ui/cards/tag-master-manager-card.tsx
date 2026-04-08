/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  deleteTagAction,
  getTagsInfiniteAction,
  markTagsAsReadAction,
  renameTagAction,
  updateTagFavoriteAction,
} from "@/actions/tag-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn-overrides/components/ui/table";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import { Switch } from "@/shadcn/components/ui/switch";
import { cn } from "@/shadcn/lib/utils";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Check,
  CheckCheck,
  Edit2,
  Loader2,
  Search,
  Sparkles,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export type TagItem = {
  id: string;
  name: string;
  kana: string | null;
  isFavorite: boolean;
  isNew: boolean;
  _count: { mediaTags: number };
};

const GRID_STYLE = "grid grid-cols-[50px_2fr_2fr_80px_100px]";

export function TagMasterManagerCard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [debouncedFilter] = useDebounce(filter, 500);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState({ name: "", kana: "" });
  const [showNewOnly, setShowNewOnly] = React.useState(false);

  // データ取得
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["tags", debouncedFilter, showNewOnly],
      queryFn: async ({ pageParam }) => {
        const res = await getTagsInfiniteAction({
          cursor: pageParam,
          query: debouncedFilter,
          onlyNew: showNewOnly,
        });
        if (!res.success) throw new Error(res.error);
        return res;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allTags =
    data?.pages.flatMap((page) => (page.tags as TagItem[]) ?? []) ?? [];

  const newTags = allTags.filter((tag) => tag.isNew);
  const newTagIds = newTags.map((tag) => tag.id);
  const newTagsCount = newTags.length;
  const hasNewTags = newTagsCount > 0;

  // 仮想化設定
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

  // ミューテーション: お気に入り更新
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      updateTagFavoriteAction(id, isFavorite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  // ミューテーション: リネーム
  const { mutate: renameTag, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      id,
      name,
      kana,
    }: {
      id: string;
      name: string;
      kana?: string;
    }) => {
      const res = await renameTagAction(id, name, kana);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingId(null);
      toast.success("タグ情報を更新しました");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ミューテーション: 削除
  const { mutate: performDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTagAction(id);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("タグを削除しました");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ミューテーション: すべて既読
  const { mutate: markAllAsRead, isPending: isMarking } = useMutation({
    mutationFn: () => markTagsAsReadAction(newTagIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("すべての新規タグを既読にしました");
    },
    onError: () => toast.error("処理に失敗しました"),
  });

  const handleStartEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditValue({ name: tag.name, kana: tag.kana ?? "" });
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.name.trim()) return toast.error("名前は必須です");
    renameTag({ id, ...editValue });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* タイトル＋説明 */}
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Tags className="w-5 h-5" />
              タグマスター管理
            </CardTitle>
            <CardDescription>
              読み順（五十音順）で表示されます。ピン留めして優先表示も可能です。
            </CardDescription>
          </div>

          {/* すべて既読にするボタン */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 h-9 border-dashed transition-all",
              hasNewTags
                ? "border-dashed hover:border-primary hover:text-primary hover:bg-primary/5"
                : "bg-muted/30 text-muted-foreground border-none opacity-70"
            )}
            onClick={() => hasNewTags && markAllAsRead()}
            disabled={isMarking || !hasNewTags}
          >
            {isMarking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasNewTags ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="font-medium">
              {hasNewTags
                ? `未読 ${newTagsCount} 件を既読にする`
                : "すべて既読済み"}
            </span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 検索バー */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="タグ名または読みで検索..."
              className="pl-9 h-10 bg-muted/5 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/50"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* 新規のみスイッチ */}
          <div className="flex items-center justify-between sm:justify-start gap-3 border rounded-md px-3 h-10 bg-background shadow-sm min-w-[130px]">
            <Label
              htmlFor="new-only"
              className="text-xs font-medium cursor-pointer whitespace-nowrap text-muted-foreground"
            >
              新規のみ
            </Label>
            <Switch
              id="new-only"
              checked={showNewOnly}
              onCheckedChange={setShowNewOnly}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* 固定ヘッダー */}
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className={cn(GRID_STYLE, "w-full border-b-0")}>
                <TableHead className="flex items-center justify-center">
                  固定
                </TableHead>
                <TableHead className="flex items-center">タグ名</TableHead>
                <TableHead className="flex items-center">
                  読み（カナ）
                </TableHead>
                <TableHead className="flex items-center justify-center">
                  使用数
                </TableHead>
                <TableHead className="flex items-center justify-end pr-4">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          <div
            ref={parentRef}
            className="h-[500px] overflow-y-auto relative scrollbar-thin"
          >
            <Table noWrapper>
              <TableBody
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const tag = allTags[virtualRow.index];
                  if (!tag) return null;

                  return (
                    <TableRow
                      key={virtualRow.key}
                      className={cn(
                        GRID_STYLE,
                        "group absolute w-full items-center border-b hover:bg-muted/30",
                        "has-[:focus]:opacity-100"
                      )}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {/* お気に入り */}
                      <TableCell className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            tag.isFavorite
                              ? "text-yellow-500"
                              : "text-muted-foreground/30 hover:text-yellow-500"
                          )}
                          onClick={() =>
                            toggleFavorite({
                              id: tag.id,
                              isFavorite: !tag.isFavorite,
                            })
                          }
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              tag.isFavorite ? "fill-current" : ""
                            )}
                          />
                        </Button>
                      </TableCell>

                      {/* タグ名 */}
                      <TableCell className="min-w-0 font-medium">
                        {editingId === tag.id ? (
                          <Input
                            value={editValue.name}
                            onChange={(e) =>
                              setEditValue((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="h-8"
                          />
                        ) : (
                          <div className="flex items-center gap-2 overflow-hidden">
                            {tag.isNew && (
                              <div className="flex items-center gap-1 bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-sm text-[10px] shadow-sm animate-pulse w-fit">
                                <Sparkles size={8} fill="currentColor" />
                                <span>NEW</span>
                              </div>
                            )}
                            <span className="truncate">{tag.name}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* 読み（カナ） */}
                      <TableCell className="min-w-0 text-muted-foreground">
                        {editingId === tag.id ? (
                          <Input
                            value={editValue.kana}
                            onChange={(e) =>
                              setEditValue((prev) => ({
                                ...prev,
                                kana: e.target.value,
                              }))
                            }
                            className="h-8"
                            placeholder="自動生成中..."
                          />
                        ) : (
                          <span className="text-xs">{tag.kana || "---"}</span>
                        )}
                      </TableCell>

                      {/* 使用数 */}
                      <TableCell className="flex justify-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {tag._count.mediaTags}
                        </Badge>
                      </TableCell>

                      {/* アクション */}
                      <TableCell className="flex justify-end gap-1 pr-4">
                        {editingId === tag.id ? (
                          <>
                            {/* 変更確定ボタン */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleSaveEdit(tag.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>

                            {/* 変更キャンセルボタン */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* 編集ボタン */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(tag)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            {/* 削除ボタン */}
                            <TagDeleteButton
                              tagName={tag.name}
                              mediaCount={tag._count.mediaTags}
                              onDelete={() => performDelete(tag.id)}
                              isDeleting={isDeleting}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TagDeleteButton({
  tagName,
  mediaCount,
  onDelete,
  isDeleting,
}: {
  tagName: string;
  mediaCount: number;
  onDelete: () => void | Promise<void>;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await onDelete();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={isDeleting}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity",
            open
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="left"
        align="center"
        className="z-50 w-72 p-4 shadow-xl"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              タグを完全に削除しますか？
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              「<span className="font-semibold text-foreground">{tagName}</span>
              」を削除します。 現在このタグが付与されている{" "}
              <span className="font-semibold text-foreground">
                {mediaCount} 件
              </span>{" "}
              のメディアから設定が解除されます。
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-bold"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              削除を実行
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
