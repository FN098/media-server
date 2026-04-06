"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  AlertCircle,
  Check,
  Edit2,
  Loader2,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import {
  deleteTagAction,
  getTagsInfiniteAction,
  renameTagAction,
} from "@/actions/tag-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/shadcn-overrides/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/components/ui/alert-dialog";
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

export type TagItem = {
  id: string;
  name: string;
  _count: { mediaTags: number };
};

export function TagRenameEditorCard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [debouncedFilter] = useDebounce(filter, 500);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  // 1. データ取得 (TanStack Query)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["tags", debouncedFilter],
      queryFn: async ({ pageParam }) => {
        const res = await getTagsInfiniteAction({
          cursor: pageParam,
          query: debouncedFilter,
        });
        if (!res.success) throw new Error(res.error);
        return res;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allTags = data?.pages.flatMap((page) => page.tags ?? []) ?? [];

  // 2. 仮想化設定 (TanStack Virtual)
  const parentRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: hasNextPage ? allTags.length + 1 : allTags.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  // 無限スクロールのトリガー
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // 底からどれくらいの位置で発火させるか（余裕を持って 100px など）
    const bottomOffset = 100;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <=
      target.clientHeight + bottomOffset;

    if (isAtBottom && hasNextPage && !isFetchingNextPage && !isLoading) {
      console.log("Fetching next page..."); // デバッグ用
      void fetchNextPage();
    }
  };

  // 3. ミューテーション: 更新
  const { mutate: rename, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await renameTagAction(id, name);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingId(null);
      toast.success("タグ名を更新しました");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // 4. ミューテーション: 削除
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

  const handleStartEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditValue(tag.name);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("タグ名を入力してください");
      return;
    }
    rename({ id, name: trimmed });
  };

  console.log({
    filter: debouncedFilter,
    dataCount: allTags.length,
    hasNextPage,
    isFetchingNextPage,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Tags className="w-5 h-5" />
          タグマスター管理
        </CardTitle>
        <CardDescription>
          システムに登録されているタグの名称変更と一括削除を管理します。
        </CardDescription>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="タグ名で検索..."
            className="pl-9 h-10 bg-muted/20 focus-visible:bg-background transition-colors"
            value={filter}
            type="search"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg bg-muted/5 overflow-hidden">
          {isLoading && allTags.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-3">
              <Loader2 className="animate-spin w-6 h-6 text-primary" />
              <p>データを読み込み中...</p>
            </div>
          ) : allTags.length > 0 ? (
            <div
              ref={parentRef}
              onScroll={handleScroll}
              className="h-[450px] overflow-y-auto scrollbar-thin bg-background relative"
            >
              <Table noWrapper>
                <TableBody
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const isLoaderRow = virtualRow.index > allTags.length - 1;
                    const tag = allTags[virtualRow.index] as
                      | TagItem
                      | undefined;

                    return (
                      <TableRow
                        key={virtualRow.key}
                        className="group absolute w-full flex items-center border-b transition-colors hover:bg-muted/30"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {isLoaderRow ? (
                          <TableCell className="flex-1 flex justify-center items-center py-4">
                            <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                          </TableCell>
                        ) : tag ? (
                          <>
                            <TableCell className="flex-1 flex items-center gap-3 min-w-0 py-0 h-full">
                              {editingId === tag.id ? (
                                <Input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveEdit(tag.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  className="h-8 flex-1 focus-visible:ring-1"
                                  disabled={isUpdating}
                                />
                              ) : (
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-medium truncate text-sm">
                                    {tag.name}
                                  </span>
                                  <Badge
                                    variant={
                                      tag._count.mediaTags > 0
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="px-1.5 py-0 text-[10px] font-mono h-4 shrink-0"
                                  >
                                    {tag._count.mediaTags}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="shrink-0 flex items-center gap-1 pr-4 py-0 h-full">
                              {editingId === tag.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => handleSaveEdit(tag.id)}
                                    disabled={isUpdating}
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
                                    disabled={isUpdating}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    onClick={() => handleStartEdit(tag)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        disabled={isDeleting}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          タグを完全に削除しますか？
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          タグ「
                                          <span className="font-bold text-foreground">
                                            {tag.name}
                                          </span>
                                          」を削除します。
                                          <br />
                                          この操作により、現在このタグが付与されている
                                          <span className="font-semibold text-foreground">
                                            {tag._count.mediaTags} 件
                                          </span>
                                          のメディアから設定が解除されます。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          キャンセル
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            void performDelete(tag.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          削除を実行
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground border-t">
              <AlertCircle className="w-5 h-5 opacity-50" />
              <p>検索条件に一致するタグが見つかりませんでした。</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
