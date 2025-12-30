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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export function TagEditorBar({ allNodes }: { allNodes: MediaNode[] }) {
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

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedPaths.has(n.path)),
    [allNodes, selectedPaths]
  );

  const { tags: masterTags } = useTags(Array.from(selectedPaths));
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const displayMasterTags = useMemo(() => {
    return uniqueBy([...masterTags, ...createdTags], "id");
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
        toast.success(`タグ "${name}" を作成しました`);
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
        router.refresh();
      } else {
        toast.error("更新に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSelection, isLoading, pendingChanges, router, selectedPaths]);

  const handleCancel = useCallback(() => {
    setPendingChanges({});
    setCreatedTags([]);
    clearSelection();
  }, [clearSelection]);

  return (
    <AnimatePresence>
      {isSelectionMode && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
        >
          <div className="max-w-screen-xl mx-auto p-4 flex flex-col gap-4">
            {/* ヘッダー: 選択件数と操作ボタン */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px]">
                  {selectedPaths.size} 件を選択中
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAll}
                  disabled={isLoading}
                >
                  すべて選択
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <CancelButton
                  onConfirm={handleCancel}
                  hasChanges={hasChanges}
                />
                <Button
                  size="sm"
                  onClick={() => void applyChanges()}
                  disabled={!hasChanges || isLoading}
                >
                  {isLoading
                    ? "更新中..."
                    : changesCount > 0
                      ? `変更を適用 (${changesCount})`
                      : "変更を適用"}{" "}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* タグバッジ一覧 */}
              {displayMasterTags.map((tag) => {
                const op = pendingChanges[tag.id];
                const isCurrentlyOn = tagStates[tag.name] === "all";
                const willBeOn =
                  op === "add" ? true : op === "remove" ? false : isCurrentlyOn;

                return (
                  <Badge
                    key={tag.id}
                    variant={willBeOn ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer py-1 px-3 text-[10px] transition-all select-none relative",
                      op === "add" && "ring-2 ring-yellow-400 ring-offset-1",
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

              {/* 新規タグ入力 */}
              <div
                className={cn(
                  "flex items-center ml-2 px-2 rounded-md border bg-muted/50 transition-all duration-300",
                  "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-background"
                )}
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
                <input
                  className="bg-transparent border-none outline-none p-1 text-xs w-24 focus:w-40 transition-all"
                  placeholder="タグを追加..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void addTag();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CancelButton({
  hasChanges,
  onConfirm,
}: {
  hasChanges: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  const onCancelClick = () => {
    if (hasChanges) {
      setOpen(true);
    } else {
      onConfirm();
    }
  };

  return (
    <>
      {/* キャンセルボタン */}
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive border-destructive"
        onClick={onCancelClick}
      >
        キャンセル
      </Button>

      {/* 確認ダイアログ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>変更が保存されていません</DialogTitle>
            <DialogDescription>
              変更内容は破棄されます。 続行しますか？
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              戻る
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              破棄する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
