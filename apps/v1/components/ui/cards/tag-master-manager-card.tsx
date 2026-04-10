"use client";

import {
  deleteTagAction,
  getTagsInfiniteAction,
  markTagsAsReadAction,
  renameTagAction,
  updateTagFavoriteAction,
} from "@/actions/tag-actions";
import { TagDeleteButton } from "@/components/ui/buttons/tag-delete-button";
import { TagMasterItem } from "@/lib/tag/types";
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
import { Switch } from "@/shadcn/components/ui/switch";
import { cn } from "@/shadcn/lib/utils";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Badge,
  Check,
  CheckCheck,
  Edit2,
  Loader2,
  Search,
  Star,
  Tags,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

const COLS_HEADER = "grid-cols-[80px_1fr_25%_100px_120px]";
const COLS_BODY = "grid-cols-[80px_1fr_25%_100px_120px]";

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
    data?.pages.flatMap((page) => (page.tags as TagMasterItem[]) ?? []) ?? [];

  const newTags = allTags.filter((tag) => tag.isNew);
  const newTagIds = newTags.map((tag) => tag.id);
  const newTagsCount = newTags.length;
  const hasNewTags = newTagsCount > 0;

  // 仮想化設定
  const parentRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
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

  const handleStartEdit = (tag: TagMasterItem) => {
    setEditingId(tag.id);
    setEditValue({ name: tag.name, kana: tag.kana ?? "" });
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.name.trim()) return toast.error("名前は必須です");
    renameTag({ id, ...editValue });
  };

  return (
    <Card className="shadow-md border-muted/60">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-primary text-xl">
              <Tags className="w-6 h-6" />
              タグマスター管理
            </CardTitle>
            <CardDescription>
              五十音順で表示。ピン留めや検索、一括既読管理が可能です。
            </CardDescription>
          </div>

          {/* 既読ボタン */}
          <Button
            variant={hasNewTags ? "default" : "secondary"}
            size="sm"
            className={cn(
              "transition-all shrink-0",
              hasNewTags ? "shadow-sm" : "opacity-60"
            )}
            onClick={() => hasNewTags && markAllAsRead()}
            disabled={isMarking || !hasNewTags}
          >
            {isMarking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : hasNewTags ? (
              <CheckCheck className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            <span className="font-semibold">
              {hasNewTags ? `${newTagsCount} 件を既読にする` : "すべて既読済み"}
            </span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* 検索バー */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="タグ名または読みで検索..."
              className="pl-9 h-11 bg-muted/20 border-muted focus-visible:ring-primary/30"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* スイッチ類 */}
          <div className="flex items-center gap-3 border rounded-lg px-4 h-11 bg-card shadow-sm shrink-0">
            <Label
              htmlFor="new-only"
              className="text-sm font-medium cursor-pointer text-muted-foreground"
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

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="border sm:rounded-lg overflow-hidden bg-background">
          {/* ヘッダー */}
          <div
            className={cn(
              "grid",
              COLS_HEADER,
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
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto scrollbar-thin"
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
                    className={cn(
                      "grid absolute w-full border-b items-center hover:bg-muted/40 group transition-colors",
                      COLS_BODY,
                      tag.isNew && "bg-yellow-50/30"
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
                        onClick={() =>
                          toggleFavorite({
                            id: tag.id,
                            isFavorite: !tag.isFavorite,
                          })
                        }
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
                            setEditValue((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="h-9"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {tag.name}
                          </span>
                          {tag.isNew && (
                            <Badge className="bg-yellow-400 hover:bg-yellow-400 text-black text-[10px] px-1.5 py-0 h-5 border-none">
                              NEW
                            </Badge>
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
                            setEditValue((prev) => ({
                              ...prev,
                              kana: e.target.value,
                            }))
                          }
                          className="h-9 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground truncate block">
                          {tag.kana || "---"}
                        </span>
                      )}
                    </div>

                    {/* 使用数 */}
                    <div>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-mono bg-muted/30">
                        {tag._count.mediaTags.toLocaleString()}
                      </div>
                    </div>

                    {/* 操作 */}
                    <div className="flex justify-end">
                      {editingId === tag.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                            onClick={() => handleSaveEdit(tag.id)}
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
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            onClick={() => handleStartEdit(tag)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <TagDeleteButton
                            tagName={tag.name}
                            mediaCount={tag._count.mediaTags}
                            onDelete={() => performDelete(tag.id)}
                            isDeleting={isDeleting}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
