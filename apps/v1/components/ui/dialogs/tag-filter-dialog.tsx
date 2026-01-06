import { useMounted } from "@/hooks/use-mounted";
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
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { ListFilter, RotateCcw, X } from "lucide-react";
import { useState } from "react";

interface TagFilterDialogProps {
  tags: string[];
  selectedTags: Set<string>;
  onApply: (tags: Set<string>) => void;
}

export function TagFilterDialog({
  tags,
  selectedTags,
  onApply,
}: TagFilterDialogProps) {
  const [tempSelected, setTempSelected] = useState<Set<string>>(
    new Set(selectedTags)
  );
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // 開く瞬間に、親の最新状態でローカルステートを上書き
      setTempSelected(new Set(selectedTags));
    }
    setOpen(nextOpen);
  };

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

  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Skeleton className="h-9 w-[140px] rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 h-9 transition-colors",
              hasSelection &&
                "border-primary bg-primary/5 text-primary hover:bg-primary/10"
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

        <DialogContent className="sm:max-w-[450px] h-[500px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              タグを選択
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-wrap items-start content-start gap-x-2 gap-y-3 p-6 overflow-y-auto border-t border-b border-transparent">
            {tags.map((tag) => {
              const isSelected = tempSelected.has(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer px-4 h-9 text-sm transition-all select-none border-transparent inline-flex items-center justify-center",
                    isSelected
                      ? "ring-2 ring-primary shadow-sm"
                      : "hover:bg-secondary/80"
                  )}
                  onClick={() => handleToggle(tag)}
                >
                  {tag}
                  {isSelected && <X className="ml-2 h-3.5 w-3.5" />}
                </Badge>
              );
            })}
          </div>

          <DialogFooter className="flex flex-row items-center justify-between p-6 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={tempSelected.size === 0}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              選択を解除
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="px-8 shadow-md"
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
          className="h-8 text-xs text-muted-foreground hover:text-destructive"
        >
          リセット
        </Button>
      )}
    </div>
  );
}
