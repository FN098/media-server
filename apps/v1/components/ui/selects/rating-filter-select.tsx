"use client";

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
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function RatingFilterSelect({
  value,
  onChange,
  className,
}: RatingFilterSelectProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10))}
    >
      <SelectTrigger className={cn("w-[160px] h-8", className)}>
        {/* valueが0の時はカスタムのプレースホルダーを表示 */}
        {value === 0 ? (
          <div className="flex items-center gap-2">
            <Star size={14} />
            <span>評価で絞り込む</span>
          </div>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>

      <SelectContent>
        {/* リセット用の項目 */}
        <SelectItem value="0" className="text-muted-foreground">
          すべての評価
        </SelectItem>

        {[5, 4, 3, 2, 1].map((rating) => (
          <SelectItem key={rating} value={rating.toString()}>
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
      </SelectContent>
    </Select>
  );
}
