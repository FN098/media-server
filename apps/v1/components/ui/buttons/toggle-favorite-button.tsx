"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type ToggleFavoriteButtonProps = {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  variant?: "grid" | "viewer";
  className?: string;
};

export function ToggleFavoriteButton({
  rating,
  onRatingChange,
  variant = "grid",
  className,
}: ToggleFavoriteButtonProps) {
  const isFavorite = rating !== null;

  // 親（Cell）のクリックイベントや長押しイベントへの伝播を止める
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    // すでにお気に入りなら解除、未設定なら★3をデフォルトで付与
    onRatingChange(isFavorite ? null : 3);
  };

  const containerStyles = {
    grid: "h-8 min-w-[32px] px-2 bg-black/60",
    viewer: "h-11 min-w-[44px] px-3 bg-white/10",
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      // 親の長押し（選択モード）などが発火しないようガード
      onMouseDown={handleInteraction}
      onMouseUp={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={handleInteraction}
      className={cn(
        "flex items-center gap-1.5 justify-center transition-all active:scale-90 group/fav",
        "rounded-full backdrop-blur-md border border-white/10 shadow-lg",
        containerStyles[variant],
        className
      )}
    >
      <Star
        className={cn(
          variant === "grid" ? "h-4 w-4" : "h-6 w-6",
          "transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-white opacity-70 group-hover/fav:opacity-100"
        )}
      />

      {/* 評価がある場合は数字を表示 */}
      {isFavorite && (
        <span
          className={cn(
            "font-bold text-yellow-400 tabular-nums",
            variant === "grid" ? "text-[10px]" : "text-sm"
          )}
        >
          {rating}
        </span>
      )}
    </button>
  );
}
