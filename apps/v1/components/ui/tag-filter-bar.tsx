import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/components/ui/dialog";
import { cn } from "@/shadcn/lib/utils";
import { ListFilter, RotateCcw, X } from "lucide-react";
import { useState } from "react";

interface TagFilterBarProps {
  tags: string[];
  selectedTags: Set<string>; // 親が持っている「確定済み」のタグ
  onApply: (tags: Set<string>) => void; // 決定時に呼ばれる
}

export function TagFilterBar({
  tags,
  selectedTags,
  onApply,
}: TagFilterBarProps) {
  // モーダル内だけで使う「仮の選択状態」
  const [tempSelected, setTempSelected] = useState<Set<string>>(
    new Set(selectedTags)
  );
  const [open, setOpen] = useState(false);

  // モーダルが開くたびに、親の最新の状態（selectedTags）で初期化する
  // useEffect(() => {
  //   if (open) {
  //     setTempSelected(new Set(selectedTags));
  //   }
  // }, [open, selectedTags]);

  if (tags.length === 0) return null;

  const handleToggle = (tag: string) => {
    const next = new Set(tempSelected);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setTempSelected(next);
  };

  const handleClear = () => {
    setTempSelected(new Set());
  };

  const handleApply = () => {
    onApply(tempSelected);
    setOpen(false); // モーダルを閉じる
  };

  const hasSelection = selectedTags.size > 0;

  return (
    <div className="flex items-center gap-2 py-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 h-9",
              hasSelection && "border-primary bg-primary/5"
            )}
          >
            <ListFilter className="h-4 w-4" />
            <span>タグで絞り込む</span>
            {hasSelection && (
              <Badge
                variant="default"
                className="ml-1 px-1.5 h-5 min-w-[20px] justify-center"
              >
                {selectedTags.size}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              タグを選択
            </DialogTitle>
          </DialogHeader>

          {/* 仮の状態（tempSelected）を表示 */}
          <div className="flex flex-wrap gap-2 py-6 overflow-y-auto">
            {tags.map((tag) => {
              const isSelected = tempSelected.has(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer px-4 py-1.5 text-sm transition-all select-none",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:bg-secondary/80"
                  )}
                  onClick={() => handleToggle(tag)}
                >
                  {tag}
                  {isSelected && <X className="ml-1.5 h-3.5 w-3.5" />}
                </Badge>
              );
            })}
          </div>

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={tempSelected.size === 0}
              className="text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              選択を解除
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="px-8"
            >
              決定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasSelection && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApply(new Set())}
          className="h-8 text-xs text-muted-foreground hover:bg-transparent hover:text-destructive"
        >
          クリア
        </Button>
      )}
    </div>
  );
}
