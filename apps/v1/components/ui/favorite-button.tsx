"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

type FavoriteButtonProps = {
  active: boolean;
  onToggle: () => void;
  className?: string;
};

export function GridViewFavoriteButton({
  active,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "z-10 rounded-full p-1",
        "bg-black/40 hover:bg-black/60 transition",
        "absolute top-1 right-1",
        className
      )}
      aria-label="お気に入り"
    >
      <Star
        className={cn(
          "h-5 w-5 transition",
          active ? "fill-yellow-400 text-yellow-400" : "text-white"
        )}
      />
    </button>
  );
}

export function ListViewFavoriteButton({
  active,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative flex items-center justify-center rounded-md p-1 transition-colors",
        "hover:bg-muted focus-visible:outline-none",
        className
      )}
      aria-label="お気に入り"
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all",
          active
            ? "fill-yellow-400 text-yellow-400 scale-110"
            : "text-muted-foreground/50 hover:text-muted-foreground"
        )}
      />
    </button>
  );
}

export function MediaViewerFavoriteButton({
  active,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "p-2 transition-colors rounded-full flex items-center justify-center",
        "bg-white/10 hover:bg-white/20",
        className
      )}
      aria-label="お気に入り"
    >
      <Star
        size={28}
        className={cn(
          "transition-all",
          active
            ? "fill-yellow-400 text-yellow-400 scale-110"
            : "text-white/70 hover:text-white"
        )}
      />
    </button>
  );
}
