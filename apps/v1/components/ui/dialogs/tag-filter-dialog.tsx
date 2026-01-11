import { useMounted } from "@/hooks/use-mounted";
import { isMatchJapanese } from "@/lib/utils/search";
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
import { Input } from "@/shadcn/components/ui/input"; // 追加
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { ListFilter, RotateCcw, Search, X } from "lucide-react"; // Searchを追加
import { useMemo, useState } from "react"; // useMemoを追加

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
  const [searchQuery, setSearchQuery] = useState(""); // 検索用ステート

  // 検索クエリに基づいてタグをフィルタリング
  const filteredTags = useMemo(() => {
    return tags.filter((tag) => isMatchJapanese(tag, searchQuery));
  }, [tags, searchQuery]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTempSelected(new Set(selectedTags));
      setSearchQuery(""); // 開くときは検索をリセット
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
    setOpen(false);
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

        <DialogContent className="sm:max-w-[450px] h-[550px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold">
              タグを選択
            </DialogTitle>
          </DialogHeader>

          {/* 検索ボックスの追加 */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="タグを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-start content-start gap-x-2 gap-y-3 p-6 overflow-y-auto border-t border-b border-muted/50">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
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
              })
            ) : (
              <div className="w-full text-center py-10 text-muted-foreground">
                <p>一致するタグが見つかりません</p>
              </div>
            )}
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
