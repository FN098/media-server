"use client";

import { useDetectMobile } from "@/hooks/general/use-mobile";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { cva } from "class-variance-authority";
import { Star } from "lucide-react";
import React from "react";

const buttonVariants = cva(
  "flex items-center gap-1 justify-center transition-all active:scale-90 group/fav outline-none",
  {
    variants: {
      variant: {
        default: "h-9 bg-transparent hover:bg-muted/50",
        small:
          "h-8 bg-black/60 backdrop-blur-md border border-white/10 shadow-lg rounded-full",
        large:
          "h-11 bg-white/10 backdrop-blur-md border border-white/10 shadow-lg rounded-full",
      },
      sizeMode: {
        iconOnly: "p-0",
        withText: "px-2",
      },
    },
    compoundVariants: [
      { variant: "small", sizeMode: "iconOnly", className: "w-8" },
      { variant: "small", sizeMode: "withText", className: "min-w-[32px]" },
      { variant: "large", sizeMode: "iconOnly", className: "w-11" },
      { variant: "large", sizeMode: "withText", className: "min-w-[44px]" },
      {
        variant: "default",
        sizeMode: "iconOnly",
        className: "w-9 rounded-full",
      },
      { variant: "default", sizeMode: "withText", className: "w-auto" },
    ],
    defaultVariants: {
      variant: "default",
      sizeMode: "iconOnly",
    },
  }
);

const starVariants = cva("transition-colors", {
  variants: {
    variant: {
      default: "h-5 w-5",
      small: "h-4 w-4",
      large: "h-6 w-6",
    },
  },
});

const textVariants = cva("font-bold text-yellow-400 tabular-nums", {
  variants: {
    variant: {
      default: "text-[11px]",
      small: "text-[10px]",
      large: "text-sm",
    },
  },
});

interface FavoriteButtonProps extends React.ComponentProps<"button"> {
  isFavorite: boolean;
  rating: number | null;
  variant?: "default" | "small" | "large";
}

export function FavoriteButton(props: FavoriteButtonProps) {
  const isMobile = useDetectMobile();

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
  variant = "default",
  className,
  ...rest
}: FavoriteButtonProps) {
  const iconOnly = rating == null;

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({
          variant,
          sizeMode: iconOnly ? "iconOnly" : "withText",
        }),
        // 「お気に入り状態」などの動的な枠線は、ここでインラインで足す方が圧倒的に見やすい
        isFavorite && variant !== "default" && "border-yellow-400/30",
        className
      )}
      {...rest}
    >
      <Star
        className={cn(
          starVariants({ variant }),
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : variant === "default"
              ? "text-muted-foreground opacity-40"
              : "text-white opacity-70 group-hover/fav:opacity-100"
        )}
      />

      {isFavorite && rating !== null && (
        <span className={cn(textVariants({ variant }))}>{rating}</span>
      )}
    </button>
  );
}
