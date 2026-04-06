import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

type FloatingFavoriteButtonProps = {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  variant: "grid" | "viewer";
  className?: string;
};

export function FloatingFavoriteButton({
  rating,
  onRatingChange,
  variant,
  className,
}: FloatingFavoriteButtonProps & { variant: "grid" | "viewer" }) {
  const isFavorite = rating !== null;

  const containerStyles = {
    grid: "h-8 w-8 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10",
    viewer:
      "h-11 w-11 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20",
  };

  const iconSize = variant === "grid" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className={cn("group relative flex items-center", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* メインボタン：クリックで 3(デフォルト) or 削除 */}
      <button
        type="button"
        onClick={() => onRatingChange(isFavorite ? null : 3)}
        className={cn(
          "flex items-center justify-center transition-all active:scale-90",
          containerStyles[variant]
        )}
      >
        <Star
          className={cn(
            iconSize,
            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/70"
          )}
        />
      </button>

      {/* ホバー時に現れるレーティングセレクター */}
      <div className="absolute left-0 top-0 hidden group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1.5 rounded-full border border-white/20 ml-9 transition-all">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => onRatingChange(num)}
            className="hover:scale-125 transition-transform px-0.5"
          >
            <Star
              className={cn(
                "h-4 w-4",
                (rating ?? 0) >= num
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-500"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
