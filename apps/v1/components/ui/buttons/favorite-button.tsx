"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

type FavoriteButtonVariant = "grid" | "list" | "viewer";

type FavoriteButtonProps = {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  variant: FavoriteButtonVariant;
  className?: string;
};

export function FavoriteButton({
  active,
  onClick,
  variant,
  className,
}: FavoriteButtonProps) {
  // 1. ボタン全体のスタイル定義
  const containerStyles = {
    grid: "h-8 w-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 shadow-sm",
    list: "h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none",
    viewer:
      "h-11 w-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20",
  };

  // 2. アイコンのスタイル定義
  const iconStyles = {
    grid: cn(
      "h-4.5 w-4.5 transition-transform duration-200", // ほんの少し小さくして余白を作る
      active ? "fill-yellow-400 text-yellow-400 scale-110" : "text-white"
    ),
    list: cn(
      "h-4 w-4",
      active
        ? "fill-yellow-400 text-yellow-400 scale-110"
        : "text-muted-foreground/50 hover:text-muted-foreground"
    ),
    viewer: cn(
      "h-7 w-7 transition-transform duration-200",
      active
        ? "fill-yellow-400 text-yellow-400 scale-110"
        : "text-white/70 hover:text-white"
    ),
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      // transition-all を付与してホバー時の背景変化を滑らかに
      className={cn(
        "transition-all active:scale-90", // クリック時のフィードバックを追加
        containerStyles[variant],
        className
      )}
      aria-label="お気に入り"
    >
      <Star className={cn(iconStyles[variant])} />
    </button>
  );
}
