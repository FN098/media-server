import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type FavoriteRatingProps = {
  value: number | null; // 3.7 みたいなのもOK
  onChange?: (newRating: number | null) => void;
  className?: string;
};

export function FavoriteRating({
  value,
  onChange,
  className,
}: FavoriteRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayValue = hoverRating ?? value ?? 0;

  return (
    <div
      className={cn("flex items-center gap-0", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((num) => {
        // この星の塗り率 (0〜1)
        const fillPercent = Math.max(0, Math.min(1, displayValue - (num - 1)));

        return (
          <button
            key={num}
            type="button"
            disabled={!onChange}
            onMouseEnter={() => onChange && setHoverRating(num)}
            onClick={(e) => {
              e.stopPropagation();
              if (!onChange) return;

              const next = value === num ? null : num;
              onChange(next);

              if (next === null) setHoverRating(null);
            }}
            className="relative p-1 transition-transform active:scale-90"
          >
            {/* 背景星 */}
            <Star className="h-4 w-4 text-muted-foreground/20" />

            {/* 部分塗り星 */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent * 100}%` }}
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
