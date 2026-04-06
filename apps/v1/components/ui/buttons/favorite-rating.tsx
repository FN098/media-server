import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type FavoriteRatingProps = {
  rating: number | null;
  onRatingChange: (newRating: number | null) => void;
  variant?: "list" | "menu";
  className?: string;
};

export function FavoriteRating({
  rating,
  onRatingChange,
  className,
}: FavoriteRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  return (
    <div
      className={cn("flex items-center gap-0 group/container", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((num) => {
        const isSelected = (rating ?? 0) >= num;
        const displayFilled =
          rating === null ? false : (hoverRating ?? rating) >= num;

        return (
          <button
            key={num}
            type="button"
            onMouseEnter={() => setHoverRating(num)}
            onClick={(e) => {
              e.stopPropagation();
              const next = rating === num ? null : num;
              onRatingChange(next);

              // クリックした瞬間にホバー状態を一度リセットするとより確実
              if (next === null) setHoverRating(null);
            }}
            className="relative p-1 transition-transform active:scale-90 flex items-center justify-center"
          >
            {/* ガイド用の星（常に薄く表示 or 親ホバーで表示） */}
            <Star
              className={cn(
                "h-4 w-4 absolute transition-opacity",
                !displayFilled
                  ? "opacity-20 text-muted-foreground"
                  : "opacity-0"
              )}
            />
            {/* メインの星 */}
            <Star
              className={cn(
                "h-4 w-4 transition-all duration-150",
                displayFilled
                  ? "fill-yellow-400 text-yellow-400 scale-110"
                  : "text-transparent fill-transparent",
                // ホバーしていない確定状態
                !hoverRating &&
                  isSelected &&
                  "fill-yellow-400/70 text-yellow-400/70 scale-100"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
