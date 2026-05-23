import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

export const AverageRatingBadge = ({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) => {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-black/60 text-yellow-400 backdrop-blur-sm px-1.5 py-0.5 rounded-sm text-[10px] font-bold shadow-sm border border-white/10 w-fit",
        className
      )}
    >
      <Star size={10} fill="currentColor" />
      <span className="text-white">{rounded.toFixed(1)}</span>
    </div>
  );
};
