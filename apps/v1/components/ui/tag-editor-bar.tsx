import { createTagAction, updateMediaTagsAction } from "@/actions/tag-actions";
import type { Tag } from "@/generated/prisma";
import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { TagOperation, TagOperator } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { useSelection } from "@/providers/selection-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Edit2, Plus, TagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function TagEditorBar({
  allNodes,
  mode = "default",
}: {
  allNodes: MediaNode[];
  mode?: "default" | "single" | "none";
}) {
  const {
    selectedValues: selectedPaths,
    selectValues: selectPaths,
    clearSelection,
    isSelectionMode,
  } = useSelection();

  const isAllSelected = selectedPaths.size === allNodes.length;

  // シングルモードの場合、現在のアイテムを自動選択
  useEffect(() => {
    if (mode === "single" && allNodes.length === 1) {
      selectPaths([allNodes[0].path]);
    }
  }, [allNodes, mode, selectPaths]);

  const router = useRouter();
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedPaths.has(n.path)),
    [allNodes, selectedPaths]
  );

  const { tags: masterTags, refreshTags } = useTags(Array.from(selectedPaths));
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const displayMasterTags = useMemo(() => {
    return uniqueBy([...masterTags, ...createdTags], "id").sort();
  }, [masterTags, createdTags]);

  // 未保存の変更を管理 { [tagId]: "add" | "remove" }
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, TagOperator>
  >({});

  const changesCount = useMemo(
    () => Object.keys(pendingChanges).length,
    [pendingChanges]
  );
  const hasChanges = changesCount > 0;

  // 閲覧モード
  const [isEditing, setIsEditing] = useState(mode !== "single");
  const viewTags = useMemo(() => {
    return masterTags.filter((tag) => tagStates[tag.name] === "all");
  }, [masterTags, tagStates]);

  const selectAll = useCallback(() => {
    const allPaths = allNodes.map((n) => n.path);
    selectPaths(allPaths);
  }, [allNodes, selectPaths]);

  const toggleTag = useCallback(
    (tag: Tag) => {
      const dbState = tagStates[tag.name] || "none";

      setPendingChanges((prev) => {
        const next = { ...prev };
        if (prev[tag.id]) {
          // 変更取り消し
          delete next[tag.id];
        } else {
          // 変更予約
          next[tag.id] = dbState === "all" ? "remove" : "add";
        }
        return next;
      });
    },
    [tagStates]
  );

  const addTag = useCallback(async () => {
    const name = newTagName.trim();
    if (!name) return;

    const existingTag = displayMasterTags.find((t) => t.name === name);
    if (existingTag) {
      setPendingChanges((prev) => ({
        ...prev,
        [existingTag.id]: "add",
      }));
      setNewTagName("");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createTagAction(name);
      if (result.success && result.tag) {
        // 作成したタグをローカルステートに追加
        setCreatedTags((prev) => [...prev, result.tag]);

        // そのタグを選択状態（add予約）にする
        setPendingChanges((prev) => ({
          ...prev,
          [result.tag.id]: "add",
        }));

        setNewTagName("");
        // toast.success(`タグ "${name}" を作成しました`);
      } else {
        toast.error("タグの作成に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  }, [displayMasterTags, newTagName]);

  const applyChanges = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Record を TagOperation[] 型に変換
      const operations: TagOperation[] = Object.entries(pendingChanges).map(
        ([tagId, operator]) => ({ tagId, operator })
      );

      const result = await updateMediaTagsAction({
        mediaPaths: Array.from(selectedPaths),
        operations,
      });

      if (result.success) {
        toast.success("タグを更新しました");
        setPendingChanges({});
        clearSelection();
        await refreshTags();
        router.refresh();
      } else {
        toast.error("更新に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    clearSelection,
    isLoading,
    pendingChanges,
    refreshTags,
    router,
    selectedPaths,
  ]);

  const handleCancel = useCallback(() => {
    setPendingChanges({});
    setCreatedTags([]);
    clearSelection();
  }, [clearSelection]);

  return (
    <AnimatePresence>
      {isSelectionMode && mode !== "none" && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[95%] max-w-2xl",
            "bg-background/80 backdrop-blur-md border rounded-xl shadow-2xl p-4"
          )}
        >
          <div className="flex flex-col gap-3">
            {/* ヘッダーセクション */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <TagIcon size={14} className="text-muted-foreground" />
                <span className="text-xs font-bold">
                  {mode === "single"
                    ? isEditing
                      ? "タグを編集"
                      : "タグ"
                    : "一括編集"}
                </span>
                {mode === "single" ? (
                  <></>
                ) : (
                  /* 一括編集モード時の全選択ボタン */
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      selectAll();
                    }}
                    disabled={isLoading}
                  >
                    <CheckCircle
                      className={cn(
                        isAllSelected &&
                          "text-xs text-green-600 hover:text-green-700"
                      )}
                    />
                    <span className="text-xs">
                      {`${selectedPaths.size} / ${allNodes.length} 件`}
                    </span>
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {mode === "single" && !isEditing ? (
                  /* 閲覧モード時の編集開始ボタン */
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 size={14} />
                  </Button>
                ) : (
                  /* 編集モード時のアクション */
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (mode === "single") {
                          setIsEditing(false);
                          setPendingChanges({});
                        } else {
                          handleCancel();
                        }
                      }}
                      className="h-8 text-xs"
                    >
                      {mode === "single" ? "キャンセル" : "リセット"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void applyChanges()}
                      disabled={!hasChanges || isLoading}
                      className="h-8 text-xs px-4"
                    >
                      {isLoading ? "保存中..." : "保存"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* コンテンツセクション */}
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {!isEditing ? (
                /* --- 閲覧モード: 選択中タグのみ --- */
                viewTags.length > 0 ? (
                  viewTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="py-1 px-3 text-[10px] pointer-events-none"
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground py-1">
                    タグが設定されていません
                  </span>
                )
              ) : (
                /* --- 編集モード: 全タグ表示 + 新規追加 --- */
                <>
                  {displayMasterTags.map((tag) => {
                    const op = pendingChanges[tag.id];
                    const isCurrentlyOn = tagStates[tag.name] === "all";
                    const willBeOn =
                      op === "add"
                        ? true
                        : op === "remove"
                          ? false
                          : isCurrentlyOn;

                    return (
                      <Badge
                        key={tag.id}
                        variant={willBeOn ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer py-1 px-3 text-[10px] transition-all select-none relative",
                          op === "add" &&
                            "ring-2 ring-yellow-400 ring-offset-1",
                          op === "remove" && "opacity-50 grayscale",
                          !willBeOn && "text-muted-foreground"
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag.name}
                        {op && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-yellow-400" />
                        )}
                      </Badge>
                    );
                  })}

                  <div className="flex items-center ml-2 px-2 rounded-md border bg-muted/30 focus-within:bg-background">
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    <input
                      className="bg-transparent border-none outline-none p-1 text-xs w-24 focus:w-40 transition-all"
                      placeholder="追加..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") void addTag();
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
