import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagingControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PagingControl({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PagingControlProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t p-3 flex items-center justify-center gap-6 z-20 shadow-lg",
        className
      )}
    >
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 select-none">
        <span className="text-sm font-bold text-primary">{currentPage}</span>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">{totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
