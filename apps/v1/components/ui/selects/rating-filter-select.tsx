"use client";

import {
  deserializeRatingFilter,
  serializeRatingFilter,
} from "@/lib/filter/serialize";
import { RatingFilterInput } from "@/lib/filter/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react"; // Filterアイコンを追加

interface RatingFilterSelectProps {
  value: RatingFilterInput;
  onChange: (value: RatingFilterInput) => void;
  className?: string;
  showUnrated?: boolean;
}

export function RatingFilterSelect({
  value,
  onChange,
  className,
  showUnrated = false,
}: RatingFilterSelectProps) {
  const serialized = serializeRatingFilter(value);

  return (
    <Select
      value={serialized}
      onValueChange={(v) => onChange(deserializeRatingFilter(v))}
    >
      <SelectTrigger className={cn("w-full h-9", className)}>
        {value.mode === "all" ? (
          <span className="text-muted-foreground">評価で絞り込む</span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all" className="text-muted-foreground">
          すべての評価
        </SelectItem>

        <div className="my-1 h-px bg-muted" />

        {[5, 4, 3, 2, 1].map((rating) => (
          <SelectItem key={rating} value={`gte:${rating}`}>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array.from({ length: 5 })].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={cn(
                      "fill-current",
                      i < rating
                        ? "text-yellow-400"
                        : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">以上</span>
            </div>
          </SelectItem>
        ))}

        {showUnrated && (
          <SelectItem value="unrated">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array.from({ length: 5 })].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="text-muted-foreground/20"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">未評価</span>
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
