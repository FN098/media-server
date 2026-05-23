import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

interface FavoriteRatingDisplayProps {
  value: number | null;
  className?: string;
}

export function FavoriteRatingDisplay({
  value,
  className,
}: FavoriteRatingDisplayProps) {
  const displayValue = value ?? 0;

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {[1, 2, 3, 4, 5].map((num) => {
        const fillPercent = Math.max(0, Math.min(1, displayValue - (num - 1)));

        return (
          <div key={num} className="relative h-6 w-6">
            {/* 背景 */}
            <Star className="absolute inset-1 h-4 w-4 text-muted-foreground/20" />

            {/* 塗り */}
            <div
              className="absolute inset-1 overflow-hidden"
              style={{ width: `${fillPercent * 100}%` }}
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
