import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { RotateCcw, Save } from "lucide-react";

interface SheetFooterProps {
  hasChanges: boolean;
  isLoading: boolean;
  opacity: number;
  onReset: () => void;
  onApply: () => void;
}

export function SheetFooter({
  hasChanges,
  isLoading,
  onReset,
  onApply,
}: SheetFooterProps) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="outline"
        className={cn("flex-1 h-12 rounded-xl gap-2")}
        onClick={onReset}
        disabled={!hasChanges || isLoading}
      >
        <RotateCcw size={16} /> リセット
      </Button>
      <Button
        className={cn(
          "flex-[2] h-12 rounded-xl gap-2 shadow-lg shadow-primary/25"
        )}
        onClick={onApply}
        disabled={!hasChanges || isLoading}
      >
        <Save size={16} /> {isLoading ? "保存中..." : "変更を保存"}
      </Button>
    </div>
  );
}
