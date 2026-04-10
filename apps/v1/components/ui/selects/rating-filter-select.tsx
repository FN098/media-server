"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { Star, StarOff } from "lucide-react"; // Filterアイコンを追加

interface RatingFilterSelectProps {
  value: number; // 0は「すべて」、-1は「未評価」、1~5は「星の数以上」
  onChange: (value: number) => void;
  className?: string;
  showUnrated?: boolean;
}

export function RatingFilterSelect({
  value,
  onChange,
  className,
  showUnrated = false,
}: RatingFilterSelectProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10))}
    >
      <SelectTrigger className={cn("w-full h-9", className)}>
        {/* すべて表示（初期状態） */}
        {value === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star size={14} />
            <span>評価で絞り込む</span>
          </div>
        )}

        {/* 未評価（フラグが有効な場合のみの表示） */}
        {value === -1 && (
          <div className="flex items-center gap-2">
            <StarOff size={14} className="text-muted-foreground" />
            <span>未評価</span>
          </div>
        )}

        {/* 1~5の星評価（SelectValueが自動的にSelectItemの中身を反映） */}
        {value > 0 && <SelectValue />}
      </SelectTrigger>

      <SelectContent>
        {/* 全表示オプション */}
        <SelectItem value="0" className="text-muted-foreground">
          すべての評価
        </SelectItem>

        <div className="my-1 h-px bg-muted" />

        {/* 星評価オプション */}
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

        {/* フラグが true の場合のみ「未評価」オプションを表示 */}
        {showUnrated && (
          <SelectItem value="-1">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array.from({ length: 5 })].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={cn("fill-current", "text-muted-foreground/20")}
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
