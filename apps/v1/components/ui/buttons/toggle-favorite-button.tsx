"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type ToggleFavoriteButtonProps = {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  variant?: "grid" | "viewer" | "list"; // list を追加
  className?: string;
};

export function ToggleFavoriteButton({
  rating,
  onRatingChange,
  variant = "grid",
  className,
}: ToggleFavoriteButtonProps) {
  const isFavorite = rating !== null;

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRatingChange(isFavorite ? null : 3);
  };

  // スタイル設定の定義
  const styles = {
    grid: {
      container:
        "h-8 min-w-[32px] px-2 bg-black/60 rounded-full backdrop-blur-md border border-white/10 shadow-lg",
      star: "h-4 w-4",
      text: "text-[10px]",
    },
    viewer: {
      container:
        "h-11 min-w-[44px] px-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10 shadow-lg",
      star: "h-6 w-6",
      text: "text-sm",
    },
    list: {
      // リスト用：背景なし、タップしやすいようにパディング広め、アイコンやや大きめ
      container: "h-9 w-9 p-0 bg-transparent hover:bg-muted/50",
      star: "h-5 w-5",
      text: "text-[11px]", // アイコンに重ねるか、横に並べるかですが、今回は既存ロジック通り横並び想定
    },
  }[variant];

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      onMouseDown={handleInteraction}
      onMouseUp={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={handleInteraction}
      className={cn(
        "flex items-center gap-1 justify-center transition-all active:scale-75 group/fav outline-none",
        styles.container,
        className
      )}
    >
      <Star
        className={cn(
          styles.star,
          "transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : variant === "list"
              ? "text-muted-foreground opacity-40" // リストの未設定時は控えめに
              : "text-white opacity-70 group-hover/fav:opacity-100"
        )}
      />

      {isFavorite && (
        <span
          className={cn("font-bold text-yellow-400 tabular-nums", styles.text)}
        >
          {rating}
        </span>
      )}
    </button>
  );
}
