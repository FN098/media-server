import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { RotateCcw } from "lucide-react";

interface FilterResetButtonProps {
  onReset: () => void;
  isVisible: boolean; // 絞り込みがある時だけ表示するため
}

export const FilterResetButton = ({
  onReset,
  isVisible,
}: FilterResetButtonProps) => {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out flex items-center",
        isVisible ? "max-w-[100px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-7 px-2 text-[11px] font-bold tracking-tighter text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1 rounded-md"
      >
        <RotateCcw className="h-3 w-3" />
        RESET
      </Button>
    </div>
  );
};
