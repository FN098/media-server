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
import { Check, Edit2, Plus, RotateCcw, Save, TagIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function TagManagerSheet({
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

  const router = useRouter();
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, TagOperator>
  >({}); // 未保存の変更を管理 { [tagId]: "add" | "remove" }

  // シングルモードの自動選択
  useEffect(() => {
    if (mode === "single" && allNodes.length === 1) {
      selectPaths([allNodes[0].path]);
    }
  }, [allNodes, mode, selectPaths]);

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedPaths.has(n.path)),
    [allNodes, selectedPaths]
  );

  const { tags: masterTags, refreshTags } = useTags(Array.from(selectedPaths));
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const displayMasterTags = useMemo(() => {
    return uniqueBy([...masterTags, ...createdTags], "id").sort();
  }, [masterTags, createdTags]);

  const [isEditing, setIsEditing] = useState(mode !== "single");

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const viewTags = useMemo(() => {
    return masterTags.filter((tag) => tagStates[tag.name] === "all");
  }, [masterTags, tagStates]);

  // --- Actions ---

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
        toast.success("保存しました");
        setPendingChanges({});
        if (mode !== "single") clearSelection();
        setIsEditing(mode !== "single");
        await refreshTags();
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    clearSelection,
    isLoading,
    mode,
    pendingChanges,
    refreshTags,
    router,
    selectedPaths,
  ]);

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

  return (
    <AnimatePresence>
      {isSelectionMode && mode !== "none" && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex flex-col justify-end">
          {/* 背景オーバーレイ（モバイルでの誤操作防止） */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={() => mode !== "single" && clearSelection()}
            />
          )}

          {/* メインシート */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full bg-background border-t rounded-t-[20px] shadow-2xl pointer-events-auto",
              "pb-safe-area-inset-bottom" // iPhoneのホームバー対策
            )}
          >
            {/* ドラッグハンドル風の装飾 */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-2" />

            <div className="px-4 pb-6 space-y-4">
              {/* ヘッダー: タイトルと基本アクション */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <TagIcon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      {mode === "single"
                        ? isEditing
                          ? "タグを編集"
                          : "タグ"
                        : "一括タグ管理"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedPaths.size}件を選択中
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && mode === "single" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={14} /> 編集
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 p-0 rounded-full"
                      onClick={() =>
                        mode === "single"
                          ? setIsEditing(false)
                          : clearSelection()
                      }
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>
              </div>

              {/* 新規タグ入力 (編集モード時のみ) */}
              {isEditing && (
                <div className="relative group">
                  <input
                    className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                    placeholder="新しいタグを入力..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void addTag()}
                  />
                  <Plus
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  {newTagName && (
                    <button
                      onClick={() => void addTag()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      追加
                    </button>
                  )}
                </div>
              )}

              {/* タグエリア */}
              <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1">
                {!isEditing ? (
                  /* 閲覧モード */
                  viewTags.length > 0 ? (
                    viewTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="py-2 px-4 rounded-lg text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 w-full text-center italic">
                      タグがありません
                    </p>
                  )
                ) : (
                  /* 編集モード */
                  displayMasterTags.map((tag) => {
                    const op = pendingChanges[tag.id];
                    const isCurrentlyOn = tagStates[tag.name] === "all";
                    const willBeOn =
                      op === "add"
                        ? true
                        : op === "remove"
                          ? false
                          : isCurrentlyOn;

                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "relative flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all active:scale-95",
                          willBeOn
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "bg-muted text-muted-foreground border-transparent",
                          op === "add" &&
                            "ring-2 ring-yellow-400 ring-offset-2",
                          op === "remove" &&
                            "opacity-40 line-through decoration-destructive"
                        )}
                      >
                        {willBeOn && <Check size={12} />}
                        {tag.name}
                        {op && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full border-2 border-background" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* フッターアクション (編集モード時のみ) */}
              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl gap-2"
                    onClick={() => setPendingChanges({})}
                    disabled={!hasChanges || isLoading}
                  >
                    <RotateCcw size={16} /> リセット
                  </Button>
                  <Button
                    className="flex-[2] h-12 rounded-xl gap-2 shadow-lg shadow-primary/25"
                    onClick={() => void applyChanges()}
                    disabled={!hasChanges || isLoading}
                  >
                    <Save size={16} />
                    {isLoading ? "保存中..." : "変更を保存"}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
