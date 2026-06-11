"use client";

import { createTagsAction } from "@/actions/tag/create";
import { deleteTagAction } from "@/actions/tag/delete";
import { getTagsInfiniteAction } from "@/actions/tag/get-infinite";
import { markTagsAsReadAction } from "@/actions/tag/mark-as-read";
import { renameTagAction } from "@/actions/tag/rename";
import { updateTagFavoriteAction } from "@/actions/tag/update-favorite";
import { TagMasterCardList } from "@/components/ui/cards/tag-master-manager-card/tag-master-card-list";
import { TagMasterTable } from "@/components/ui/cards/tag-master-manager-card/tag-master-table";
import { TagMasterItem } from "@/lib/tag/types";
import { useDetectMobileContext } from "@/providers/mobile-provider";
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
import { Check, CheckCheck, Loader2, Plus, Search, Tags } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

interface TagListProps {
  tags: TagMasterItem[];
  editingId: string | null;
  editValue: { name: string; kana: string };
  isUpdating: boolean;
  isDeleting: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isMarking: boolean;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onStartEdit: (tag: TagMasterItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: { name: string; kana: string }) => void;
  onDelete: (id: string) => void;
  onFetchNext: () => void;
  onMarkAsRead: (id: string) => void;
}

export function TagMasterManagerCard() {
  const queryClient = useQueryClient();
  const isMobile = useDetectMobileContext();
  const [filter, setFilter] = React.useState("");
  const [debouncedFilter] = useDebounce(filter, 500);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState({ name: "", kana: "" });
  const [showNewOnly, setShowNewOnly] = React.useState(false);
  const [newTagsInput, setNewTagsInput] = React.useState("");

  // タグ無限スクロール
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

  // タグ作成
  const { mutate: createTags, isPending: isCreating } = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await createTagsAction(names);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(`${res.tags.length} 件のタグを登録しました`);
      setNewTagsInput("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // タグお気に入りトグル
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      updateTagFavoriteAction(id, isFavorite),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tags"] }),
    onError: () => toast.error("更新に失敗しました"),
  });

  // タグリネーム
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

  // タグ削除
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

  // タグ一括既読
  const { mutate: markAsRead, isPending: isMarking } = useMutation({
    mutationFn: (ids: string[]) => markTagsAsReadAction(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("既読にしました");
    },
    onError: () => toast.error("処理に失敗しました"),
  });

  // タグ作成
  const handleCreateTags = (e: React.FormEvent) => {
    e.preventDefault();
    const names = newTagsInput
      .split(/[,、\n]/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (names.length === 0) return;
    createTags(names);
  };

  // タグ編集開始
  const handleStartEdit = (tag: TagMasterItem) => {
    setEditingId(tag.id);
    setEditValue({ name: tag.name, kana: tag.kana ?? "" });
  };

  // タグ編集保存
  const handleSaveEdit = (id: string) => {
    if (!editValue.name.trim()) return toast.error("名前は必須です");
    renameTag({ id, ...editValue });
  };

  const listProps = {
    tags: allTags,
    editingId,
    editValue,
    isUpdating,
    isDeleting,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isMarking: isMarking,
    onToggleFavorite: (id: string, isFavorite: boolean) =>
      toggleFavorite({ id, isFavorite }),
    onStartEdit: handleStartEdit,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: () => setEditingId(null),
    onEditValueChange: setEditValue,
    onDelete: (id: string) => performDelete(id),
    onFetchNext: () => void fetchNextPage(),
    onMarkAsRead: (id: string) => markAsRead([id]),
  } satisfies TagListProps;

  return (
    <Card className="shadow-md border-muted/60">
      {/* タイトル・説明 */}
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-primary text-xl">
            <Tags className="w-6 h-6" />
            タグマスター管理
          </CardTitle>
          <CardDescription>
            五十音順で表示。ピン留めや検索、一括既読管理が可能です。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0 space-y-4">
        {/* メイン操作メニュー */}
        <div className="space-y-3 px-4 sm:px-0">
          {/* タグ検索 */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="タグ名または読みで検索..."
              className="pl-9 h-11 bg-muted/20 border-muted focus-visible:ring-primary/30"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* 新規タグ追加 */}
          <form
            onSubmit={handleCreateTags}
            className="flex gap-2 bg-muted/30 p-2 rounded-lg border border-dashed border-muted-foreground/30 items-center"
          >
            <div className="relative flex-1">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="新しいタグを追加..."
                className="pl-9 bg-background border-none shadow-none focus-visible:ring-1"
                value={newTagsInput}
                onChange={(e) => setNewTagsInput(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating || !newTagsInput.trim()}
              className="shrink-0"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "追加"
              )}
            </Button>
          </form>
        </div>

        {/* 境界線 */}
        <hr className="border-muted/60 mx-4 sm:mx-0" />

        {/* その他の操作メニュー */}
        <div className="flex flex-row justify-between items-start sm:items-center gap-3 px-4 sm:px-0">
          {/* 新規のみフィルター */}
          <div className="flex items-center gap-3 border rounded-lg px-4 h-9 bg-card shadow-sm shrink-0">
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

          {/* 既読チェックボタン */}
          <Button
            variant={hasNewTags ? "default" : "secondary"}
            size="sm"
            className={cn(
              "transition-all shrink-0",
              hasNewTags ? "shadow-sm" : "opacity-60"
            )}
            onClick={() => hasNewTags && markAsRead(newTagIds)}
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

        {/* タグ一覧 */}
        <div className="pt-2">
          {isMobile ? (
            <TagMasterCardList {...listProps} />
          ) : (
            <TagMasterTable {...listProps} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
