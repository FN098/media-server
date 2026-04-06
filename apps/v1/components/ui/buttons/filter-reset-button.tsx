import { Button } from "@/shadcn/components/ui/button";
import { X } from "lucide-react";

interface FilterResetButtonProps {
  onReset: () => void;
  isVisible: boolean; // 絞り込みがある時だけ表示するため
}

export const FilterResetButton = ({
  onReset,
  isVisible,
}: FilterResetButtonProps) => {
  if (!isVisible) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onReset}
      className="h-8 px-2 text-muted-foreground hover:text-destructive flex items-center gap-1 transition-all animate-in fade-in zoom-in duration-200"
    >
      <X className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">リセット</span>
    </Button>
  );
};
