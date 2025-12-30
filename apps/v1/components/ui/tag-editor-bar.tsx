import type { Tag } from "@/generated/prisma";
import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { useSelection } from "@/providers/selection-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

type TagOp = "add" | "remove";

export function TagEditorBar({ allNodes }: { allNodes: MediaNode[] }) {
  const { selectedIds, selectIds, clearSelection, isSelectionMode } =
    useSelection();

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedIds.has(n.path)),
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

  const { tags: masterTags } = useTags();
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const selectAll = () => {
    const all = allNodes.map((n) => n.path);
    selectIds(all);
  };

  const addTag = () => {
    // TODO: タグ追加ロジック
    // サーバーアクションで新規タグを DB に追加し、masterTags に反映
    setNewTagName("");
  };

  const toggleTag = (tag: Tag) => {
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
  };

  const applyChanges = () => {
    // TODO: サーバーアクションで changed をDBに適用
  };

  const handleCancel = () => {
    setPendingChanges({});
    clearSelection();
  };

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
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="text-destructive hover:text-destructive border-destructive"
            >
              選択解除
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={applyChanges}
              disabled={Object.keys(pendingChanges).length === 0}
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
                  "cursor-pointer py-1 px-3 text-xs transition-all select-none",
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
                  addTag();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
