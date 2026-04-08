/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  deleteTagAction,
  getTagsInfiniteAction,
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
import {
  AlertDialogFooter,
  AlertDialogHeader,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@radix-ui/react-alert-dialog";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Check,
  Edit2,
  Loader2,
  Search,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export type TagItem = {
  id: string;
  name: string;
  kana: string | null;
  isFavorite: boolean;
  _count: { mediaTags: number };
};

export function TagMasterManagerCard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [debouncedFilter] = useDebounce(filter, 500);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState({ name: "", kana: "" });

  // データ取得
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
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

  const allTags =
    data?.pages.flatMap((page) => (page.tags as TagItem[]) ?? []) ?? [];

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

  // ミューテーション: 名前更新
  const { mutate: updateTag, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await renameTagAction(id, name);
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

  const handleStartEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditValue({ name: tag.name, kana: tag.kana ?? "" });
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.name.trim()) return toast.error("名前は必須です");
    updateTag({ id, ...editValue });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Tags className="w-5 h-5" />
              タグマスター管理
            </CardTitle>
            <CardDescription>
              読み順（五十音順）で表示されます。ピン留めして優先表示も可能です。
            </CardDescription>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="タグ名または読みで検索..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* 固定ヘッダー */}
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="flex w-full">
                <TableHead className="w-[50px] flex items-center justify-center">
                  固定
                </TableHead>
                <TableHead className="flex-[2] flex items-center">
                  タグ名
                </TableHead>
                <TableHead className="flex-[2] flex items-center">
                  読み（カナ）
                </TableHead>
                <TableHead className="w-[80px] flex items-center justify-center">
                  使用数
                </TableHead>
                <TableHead className="w-[150px] flex items-center justify-end pr-4">
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
                      className={`group absolute w-full flex items-center border-b hover:bg-muted/30 ${tag.isFavorite ? "bg-yellow-50/30" : ""}`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {/* お気に入り */}
                      <TableCell className="w-[50px] flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${tag.isFavorite ? "text-yellow-500" : "text-muted-foreground/30 hover:text-yellow-500"}`}
                          onClick={() =>
                            toggleFavorite({
                              id: tag.id,
                              isFavorite: !tag.isFavorite,
                            })
                          }
                        >
                          <Star
                            className={`h-4 w-4 ${tag.isFavorite ? "fill-current" : ""}`}
                          />
                        </Button>
                      </TableCell>

                      {/* タグ名 */}
                      <TableCell className="flex-[2] min-w-0 font-medium">
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
                          <span className="truncate">{tag.name}</span>
                        )}
                      </TableCell>

                      {/* 読み（カナ） */}
                      <TableCell className="flex-[2] min-w-0 text-muted-foreground">
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
                      <TableCell className="w-[80px] flex justify-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {tag._count.mediaTags}
                        </Badge>
                      </TableCell>

                      {/* アクション */}
                      <TableCell className="w-[100px] flex justify-end gap-1 pr-4">
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
                                    onClick={() => void performDelete(tag.id)}
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
