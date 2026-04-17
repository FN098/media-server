"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type ToggleFavoriteButtonProps = {
  isFavorite: boolean;
  rating: number | null;
  onToggle: () => void;
  variant?: "grid" | "viewer" | "list";
  className?: string;
};

export function ToggleFavoriteButton({
  isFavorite,
  rating,
  onToggle,
  variant = "grid",
  className,
}: ToggleFavoriteButtonProps) {
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
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
      onClick={handleClick}
      onMouseDown={handleInteraction}
      onMouseUp={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={handleInteraction}
      className={cn(
        "flex items-center gap-1 justify-center transition-all active:scale-90 group/fav outline-none",
        styles.container,
        // お気に入り時は枠線を少し目立たせる（任意）
        isFavorite && variant !== "list" && "border-yellow-400/30",
        className
      )}
    >
      <Star
        className={cn(
          styles.star,
          "transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400" // お気に入りなら黄色（評価nullでも）
            : variant === "list"
              ? "text-muted-foreground opacity-40"
              : "text-white opacity-70 group-hover/fav:opacity-100"
        )}
      />

      {/* 評価値がある場合のみ数字を表示 */}
      {isFavorite && rating !== null && (
        <span
          className={cn("font-bold text-yellow-400 tabular-nums", styles.text)}
        >
          {rating}
        </span>
      )}
    </button>
  );
}
