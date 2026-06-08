"use client";

import { useDetectMobileContext } from "@/providers/mobile-provider";
import { Button } from "@/shadcn/components/ui/button";
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
interface FavoriteButtonProps extends React.ComponentProps<"button"> {
  isFavorite: boolean;
  rating: number | null;
  size?: "default" | "small" | "large";
}

export function FavoriteButton(props: FavoriteButtonProps) {
  const isMobile = useDetectMobileContext();

  // モバイルなら Tooltip 使わない
  if (isMobile) {
    return <Trigger {...props} />;
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Trigger {...props} />
        </TooltipTrigger>
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

function Trigger({
  isFavorite,
  rating,
  size = "default",
  className,
  ...rest
}: FavoriteButtonProps) {
  const iconOnly = rating == null;

  if (size === "large") {
    return (
      <button
        className={cn(
          "flex items-center gap-1",
          "p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none",
          className
        )}
        {...rest}
      >
        <Star
          size={28}
          className={cn(isFavorite ? "fill-yellow-400 text-yellow-400" : "")}
        />
        {isFavorite && rating != null && (
          <span className="text-sm font-bold text-yellow-400 tabular-nums">
            {rating}
          </span>
        )}
      </button>
    );
  }

  if (size === "small") {
    return (
      <Button
        variant="ghost"
        className={cn(
          "gap-1",
          "h-8 rounded-full bg-background/20 hover:bg-background/50",
          iconOnly ? "w-8" : "px-2",
          className
        )}
        {...rest}
      >
        <Star
          className={cn(isFavorite ? "fill-yellow-400 text-yellow-400" : "")}
        />
        {isFavorite && rating != null && (
          <span className="text-[10px] font-bold text-yellow-400 tabular-nums">
            {rating}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "gap-1",
        "h-9 rounded-full bg-background/20 hover:bg-background/50",
        iconOnly ? "w-9" : "px-2",
        className
      )}
      {...rest}
    >
      <Star
        className={cn(
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground opacity-40"
        )}
      />
      {isFavorite && rating != null && (
        <span className="text-[11px] font-bold text-yellow-400 tabular-nums">
          {rating}
        </span>
      )}
    </Button>
  );
}
