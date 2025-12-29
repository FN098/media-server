import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { useSelection } from "@/providers/selection-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

export function TagEditorBar({ allNodes }: { allNodes: MediaNode[] }) {
  const { selectedIds, selectIds, clearSelection, isSelectionMode } =
    useSelection();
  const [newTagName, setNewTagName] = useState("");

  // 選択されたノードの実データを取得
  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedIds.has(n.path)),
    [allNodes, selectedIds]
  );

  // 全タグ一覧
  const { tags: masterTags } = useTags();
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const selectAll = () => {
    const all = allNodes.map((n) => n.path);
    selectIds(all);
  };

  if (!isSelectionMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-screen-xl mx-auto p-4 flex flex-col gap-4">
        {/* ヘッダー: 選択件数と操作ボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">
              {selectedIds.size} 件を選択中
            </span>
            <Button size="sm" variant="outline" onClick={selectAll}>
              すべて選択
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              解除
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" /> キャンセル
            </Button>
            <Button
              size="sm"
              onClick={() => {
                /* 反映処理 */
              }}
            >
              変更を適用
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* タグバッジ一覧 */}
          {masterTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={tagStates[tag.name] === "none" ? "outline" : "default"}
              className={cn(
                "cursor-pointer py-1 px-3 text-sm transition-all",
                tagStates[tag.name] === "some" &&
                  "opacity-60 ring-2 ring-primary/30",
                tagStates[tag.name] === "all" &&
                  "bg-primary text-primary-foreground"
              )}
              onClick={() => {
                /* トグル処理 */
              }}
            >
              {tag.name}
              {tagStates[tag.name] === "some" && " (+)"}
            </Badge>
          ))}

          {/* 新規タグ入力 */}
          <div className="flex items-center ml-2 border rounded-md px-2 bg-muted/50 focus-within:ring-1 ring-primary">
            <Plus className="h-3 w-3 text-muted-foreground" />
            <input
              className="bg-transparent border-none outline-none p-1 text-sm w-24 focus:w-40 transition-all"
              placeholder="タグを追加..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // タグ追加ロジック
                  setNewTagName("");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
