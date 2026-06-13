import { createTagsAction } from "@/actions/tag/create";
import { deleteTagAction } from "@/actions/tag/delete";
import { getTagsInfiniteAction } from "@/actions/tag/get-infinite";
import { markTagsAsReadAction } from "@/actions/tag/mark-as-read";
import { renameTagAction } from "@/actions/tag/rename";
import { updateTagFavoriteAction } from "@/actions/tag/update-favorite";
import { TagMasterItem } from "@/lib/tag/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export function useTagMaster() {
  const queryClient = useQueryClient();

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
        if (!res.success) throw new Error(res.message);
        return res;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allTags = data?.pages.flatMap((page) => page.tags) ?? [];

  const newTags = allTags.filter((tag) => tag.isNew);
  const newTagIds = newTags.map((tag) => tag.id);
  const newTagsCount = newTags.length;
  const hasNewTags = newTagsCount > 0;

  // タグ作成
  const { mutate: createTags, isPending: isCreating } = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await createTagsAction({ names });
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(`${res.tags.length} 件のタグを登録しました`);
      setNewTagsInput("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCreateTags = (e: React.SubmitEvent) => {
    e.preventDefault();
    const names = newTagsInput
      .split(/[,、\n]/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (names.length === 0) return;
    createTags(names);
  };

  // タグお気に入りトグル
  const { mutate: toggleTagFavorite } = useMutation({
    mutationFn: async (current: { id: string; isFavorite: boolean }) => {
      const res = await updateTagFavoriteAction(
        current.id,
        !current.isFavorite
      );
      if (!res.success) throw new Error(res.error);
      return res;
    },
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
      const res = await renameTagAction({ id, newName: name, newKana: kana });
      if (!res.success) throw new Error(res.message);
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
  const { mutate: deleteTag, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTagAction({ id });
      if (!res.success) throw new Error(res.message);
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
    mutationFn: async (ids: string[]) => {
      const res = await markTagsAsReadAction(ids);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("既読にしました");
    },
    onError: () => toast.error("処理に失敗しました"),
  });

  // タグ編集開始
  const startEdit = useCallback((tag: TagMasterItem) => {
    setEditingId(tag.id);
    setEditValue({ name: tag.name, kana: tag.kana ?? "" });
  }, []);

  // タグ編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // タグ編集保存
  const saveChanges = useCallback(
    (id: string) => {
      if (!editValue.name.trim()) return toast.error("名前は必須です");
      renameTag({ id, ...editValue });
    },
    [editValue, renameTag]
  );

  return {
    allTags,
    filter: debouncedFilter,
    setFilter,
    editingId,
    editValue,
    setEditValue,
    showNewOnly,
    setShowNewOnly,
    fetchNextPage,
    hasNextPage,
    hasNewTags,
    isFetchingNextPage,
    newTagIds,
    isCreating,
    handleCreateTags,
    toggleTagFavorite,
    isUpdating,
    markAsRead,
    isMarking,
    deleteTag,
    isDeleting,
    startEdit,
    cancelEdit,
    saveChanges,
    newTagsInput,
    setNewTagsInput,
    newTagsCount,
  };
}
