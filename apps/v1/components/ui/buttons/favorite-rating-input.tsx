import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

interface FavoriteRatingInputProps {
  value: number | null;
  onChange: (newRating: number | null) => void;
  className?: string;
}

export function FavoriteRatingInput({
  value,
  onChange,
  className,
}: FavoriteRatingInputProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const displayValue = hoverRating ?? value ?? 0;

  return (
    <div
      className={cn("flex items-center gap-0", className)}
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((num) => {
        const filled = displayValue >= num;

        return (
          <button
            key={num}
            type="button"
            onMouseEnter={() => setHoverRating(num)}
            onClick={() => {
              const next = value === num ? null : num;
              onChange(next);

              if (next === null) setHoverRating(null);
            }}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-all duration-150",
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/20"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
