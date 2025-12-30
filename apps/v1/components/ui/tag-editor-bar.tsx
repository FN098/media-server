import { createTagAction, updateMediaTagsAction } from "@/actions/tag-actions";
import type { Tag } from "@/generated/prisma";
import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
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
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type TagOp = "add" | "remove";

export function TagEditorBar({ allNodes }: { allNodes: MediaNode[] }) {
  const { selectedIds, selectIds, clearSelection, isSelectionMode } =
    useSelection();

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedIds.has(n.id)),
    [allNodes, selectedIds]
  );

  const [newTagName, setNewTagName] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, TagOp>>(
    {}
  );

  const changesCount = useMemo(
    () => Object.keys(pendingChanges).length,
    [pendingChanges]
  );
  const hasChanges = changesCount > 0;

  const { tags: masterTags } = useTags();
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  console.log("selectedIds.size", selectedIds.size);
  console.log("selectedNodes.length", selectedNodes.length);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const selectAll = useCallback(() => {
    const allIds = allNodes.map((n) => n.id);
    selectIds(allIds);
  }, [allNodes, selectIds]);

  const toggleTag = useCallback(
    (tag: Tag) => {
      const isCurrentlyAll = tagStates[tag.name] === "all";

      setPendingChanges((prev) => {
        const next = { ...prev };
        const currentOp = prev[tag.id];

        if (currentOp) {
          // すでに変更リストにある場合は、変更をキャンセル（元に戻す）
          delete next[tag.id];
        } else {
          // 元が ON なら「削除予約」、OFF なら「追加予約」
          next[tag.id] = isCurrentlyAll ? "remove" : "add";
        }
        return next;
      });
    },
    [tagStates]
  );

  const applyChanges = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true); // ローディング状態を追加

    const result = await updateMediaTagsAction({
      mediaIds: Array.from(selectedIds) as string[],
      changes: pendingChanges,
    });

    if (result.success) {
      toast.success("タグを更新しました");

      // 状態のクリーンアップ
      setPendingChanges({});
      clearSelection();

      // 画面のデータを最新にする
      router.refresh();
    } else {
      toast.error("更新に失敗しました");
    }

    setIsLoading(false);
  }, [clearSelection, isLoading, pendingChanges, router, selectedIds]);

  const addTag = useCallback(async () => {
    const name = newTagName.trim();
    if (!name) return;

    // すでにマスタにあるか確認
    const existingTag = masterTags.find((t) => t.name === name);

    if (existingTag) {
      // すでに存在する場合、そのタグを ON にする（add予約）
      toggleTag(existingTag);
      setNewTagName("");
      return;
    }

    const result = await createTagAction(name);
    if (result.success && result.tag) {
      // 1. マスタリストを更新（SWRや独自の状態管理、または revalidatePath）
      // ここでは masterTags が再取得される想定

      // 2. 作成したタグを選択中の全ファイルに対して "add" 予約
      setPendingChanges((prev) => ({
        ...prev,
        [result.tag.id]: "add",
      }));

      setNewTagName("");
      toast.success(`タグ "${name}" を作成しました`);
    } else {
      toast.error("タグの作成に失敗しました");
    }
  }, [masterTags, newTagName, toggleTag]);

  const handleCancel = useCallback(() => {
    setPendingChanges({});
    clearSelection();
  }, [clearSelection]);

  if (!isSelectionMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-screen-xl mx-auto p-4 flex flex-col gap-4">
        {/* ヘッダー: 選択件数と操作ボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px]">{selectedIds.size} 件を選択中</span>
            <Button size="sm" variant="outline" onClick={selectAll}>
              すべて選択
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <CancelButton onConfirm={handleCancel} hasChanges={hasChanges} />
            <Button
              size="sm"
              onClick={() => void applyChanges()}
              disabled={!hasChanges || isLoading}
            >
              {changesCount > 0 ? `変更を適用 (${changesCount})` : "変更を適用"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* タグバッジ一覧 */}
          {masterTags.map((tag) => {
            const op = pendingChanges[tag.id];
            const displayState =
              op === "add"
                ? "all"
                : op === "remove"
                  ? "none"
                  : tagStates[tag.name];

            return (
              <Badge
                key={tag.id}
                variant={displayState === "none" ? "outline" : "default"}
                className={cn(
                  "cursor-pointer py-1 px-3 text-[10px] transition-all select-none",
                  tagStates[tag.name] === "all" &&
                    "bg-primary text-primary-foreground"
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
            />
          </div>
        </div>
      </div>
    </div>
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
