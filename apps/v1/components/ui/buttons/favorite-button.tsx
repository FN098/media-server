"use client";

import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";
import React from "react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  rating: number | null;
  onClick: () => void;
  variant?: "grid" | "viewer" | "list";
  disabled?: boolean;
  className?: string;
}

export function FavoriteButton({
  isFavorite,
  rating,
  onClick,
  variant = "grid",
  disabled,
  className,
}: FavoriteButtonProps) {
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const iconOnly = rating == null;

  // スタイル設定の定義
  const styles = {
    grid: {
      container: cn(
        "h-8 backdrop-blur-md border border-white/10 shadow-lg",
        iconOnly
          ? "w-8 rounded-full bg-black/60 p-0"
          : "min-w-[32px] px-2 rounded-full bg-black/60"
      ),
      star: "h-4 w-4",
      text: "text-[10px]",
    },
    viewer: {
      container: cn(
        "h-11 backdrop-blur-md border border-white/10 shadow-lg",
        iconOnly
          ? "w-11 rounded-full bg-white/10 p-0"
          : "min-w-[44px] px-3 rounded-full bg-white/10"
      ),
      star: "h-6 w-6",
      text: "text-sm",
    },
    list: {
      container: cn(
        "h-9",
        iconOnly ? "w-9 rounded-full p-0" : "w-auto px-2",
        "bg-transparent hover:bg-muted/50"
      ),
      star: "h-5 w-5",
      text: "text-[11px]",
    },
  }[variant];

  const button = (
    <button
      type="button"
      disabled={disabled}
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

  const isMobile = useIsMobile();

  // モバイルなら Tooltip 使わない
  if (isMobile) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" align="center">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span>お気に入りをトグル</span>
            <Kbd>S</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
