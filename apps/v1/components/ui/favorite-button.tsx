"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

type FavoriteButtonVariant = "grid" | "list" | "viewer";

type FavoriteButtonProps = {
  active: boolean;
  onToggle: () => void;
  variant: FavoriteButtonVariant;
  className?: string;
};

export function FavoriteButton({
  active,
  onToggle,
  variant,
  className,
}: FavoriteButtonProps) {
  // 1. ボタン全体のスタイル定義
  const containerStyles = {
    grid: "z-10 rounded-full p-1 bg-black/40 hover:bg-black/60 absolute top-1 right-1",
    list: "relative flex items-center justify-center rounded-md p-1 hover:bg-muted focus-visible:outline-none",
    viewer:
      "p-2 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20",
  };

  // 2. アイコンのスタイル定義
  const iconStyles = {
    grid: cn(
      "h-5 w-5",
      active ? "fill-yellow-400 text-yellow-400" : "text-white"
    ),
    list: cn(
      "h-4 w-4",
      active
        ? "fill-yellow-400 text-yellow-400 scale-110"
        : "text-muted-foreground/50 hover:text-muted-foreground"
    ),
    viewer: cn(
      "h-[28px] w-[28px]", // size={28} に相当
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
        onToggle();
      }}
      className={cn("transition-all", containerStyles[variant], className)}
      aria-label="お気に入り"
    >
      <Star className={cn("transition-all", iconStyles[variant])} />
    </button>
  );
}
