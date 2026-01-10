import { AnimatedCheckCircle } from "@/components/ui/icons/animated-check-circle";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface SelectionBarProps {
  count: number;
  totalCount: number;
  onSelectAll: () => void;
  onClose: () => void;
  actions: React.ReactNode;
  className?: string;
}

export function SelectionBar({
  count,
  totalCount,
  onSelectAll,
  onClose,
  actions,
  className,
}: SelectionBarProps) {
  const isAllSelected = count > 0 && count === totalCount;
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ y: 100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      exit={{ y: 100, x: "-50%", opacity: 0 }}
      className={cn(
        "fixed bottom-8 left-1/2 z-[60] w-[95%] max-w-md pointer-events-auto",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 p-2 bg-background/80 backdrop-blur-xl border rounded-2xl shadow-2xl">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-xl text-xs h-10 px-3 gap-2",
            isAllSelected && "bg-green-500/10"
          )}
          onClick={onSelectAll}
        >
          <AnimatedCheckCircle active={isAllSelected} />
          {isAllSelected ? "全選択済み" : "すべて選択"}
        </Button>

        <div className="flex-1 text-center">
          <span className="text-sm font-bold">{count}</span>
          <span className="text-[10px] text-muted-foreground ml-1">
            {isMobile ? "項目" : "項目を選択"}
          </span>
        </div>

        <div className="flex gap-1 items-center">
          {actions} {/* ここに編集ボタンやダウンロードボタンが入る */}
          <div className="w-[1px] h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl w-10 h-10 p-0"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
