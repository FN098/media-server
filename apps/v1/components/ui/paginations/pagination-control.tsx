import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

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

  const pages = generatePagination(currentPage, totalPages);

  return (
    <div
      className={cn(
        "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t p-3 flex items-center justify-center gap-2 z-20 shadow-lg",
        className
      )}
    >
      {/* 前へボタン */}
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* ページ番号エリア */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          }

          const isCurrent = currentPage === page;

          return (
            <Button
              key={page}
              variant={isCurrent ? "outline" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 text-sm",
                isCurrent && "border-primary text-primary font-bold"
              )}
              onClick={() => onPageChange(page as number)}
              disabled={isCurrent}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* 次へボタン */}
      <Button
        variant="ghost"
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

/**
 * ページネーションの配列を生成するロジック
 */
function generatePagination(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}
