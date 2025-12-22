"use client";

import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

type FavoriteButtonProps = {
  active: boolean;
  onToggle: () => void;
  className?: string;
};

export function FavoriteButton({
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
        "absolute top-1 right-1 z-10 rounded-full p-1",
        "bg-black/40 hover:bg-black/60",
        "transition",
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
