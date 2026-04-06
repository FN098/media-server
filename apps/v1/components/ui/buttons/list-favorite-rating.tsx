import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type ListFavoriteRatingProps = {
  rating: number | null;
  onRatingChange: (newRating: number | null) => void;
  className?: string;
};

export function ListFavoriteRating({
  rating,
  onRatingChange,
  className,
}: ListFavoriteRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((num) => {
        const isActive = (hoverRating ?? rating ?? 0) >= num;
        const isSelected = (rating ?? 0) >= num;

        return (
          <button
            key={num}
            type="button"
            onMouseEnter={() => setHoverRating(num)}
            onClick={() => {
              // 既にその星が選択されている状態でクリックしたら解除
              onRatingChange(rating === num ? null : num);
            }}
            className="p-0.5 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                isActive
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30",
                !hoverRating && isSelected && "fill-yellow-400/80" // 確定状態は少し落ち着かせる
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
