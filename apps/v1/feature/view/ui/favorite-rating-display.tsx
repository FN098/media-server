import { cn } from "@/shadcn/lib/utils";
import { StarIcon } from "lucide-react";

const STAR_SIZE = 16;
const PADDING = 4;

interface FavoriteRatingDisplayProps {
  value: number;
  className?: string;
}

export function FavoriteRatingDisplay({
  value,
  className,
}: FavoriteRatingDisplayProps) {
  const normalized = Math.round(value * 10) / 10;
  const title = normalized.toFixed(1);

  return (
    <div className={cn("flex items-center gap-0", className)} title={title}>
      {[1, 2, 3, 4, 5].map((num) => {
        const fillPercent = Math.max(0, Math.min(1, normalized - (num - 1)));

        return (
          <div key={num} className="relative h-6 w-6">
            <StarIcon className="absolute inset-1 h-4 w-4 text-muted-foreground/20" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                width: `${PADDING + fillPercent * STAR_SIZE}px`,
              }}
            >
              <StarIcon className="absolute inset-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
