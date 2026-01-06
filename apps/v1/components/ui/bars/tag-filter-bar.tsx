import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { RotateCcw, X } from "lucide-react";

interface TagFilterBarProps {
  tags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export function TagFilterBar({
  tags,
  selectedTags,
  onToggle,
  onClear,
}: TagFilterBarProps) {
  if (tags.length === 0) return null;

  const hasSelection = selectedTags.size > 0;

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* タグ一覧 */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.has(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "cursor-pointer px-3 py-1 transition-all",
                isSelected
                  ? "ring-2 ring-primary ring-offset-1"
                  : "hover:bg-secondary/80"
              )}
              onClick={() => onToggle(tag)}
            >
              {tag}
              {isSelected && <X className="ml-1.5 h-3 w-3" />}
            </Badge>
          );
        })}
      </div>

      {/* フィルターの状態表示とリセットボタン */}
      {hasSelection && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-dashed animate-in fade-in slide-in-from-top-1">
          <div className="text-sm text-muted-foreground ml-2">
            <span className="font-medium text-foreground">
              {selectedTags.size}
            </span>
            個のタグで絞り込み中
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-8 gap-2 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            フィルターをリセット
          </Button>
        </div>
      )}
    </div>
  );
}
