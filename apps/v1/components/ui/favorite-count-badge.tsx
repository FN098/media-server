import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

export const FavoriteCountBadge = ({
  count,
  className,
}: {
  count: number;
  className?: string;
}) => {
  // if (count <= 0) return null; // 0の場合は表示しない（お好みで）

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-black/60 text-yellow-400 backdrop-blur-sm px-1.5 py-0.5 rounded-sm text-[10px] font-bold shadow-sm border border-white/10 w-fit",
        className
      )}
    >
      <Star size={10} fill="currentColor" />
      <span className="text-white">{count.toLocaleString()}</span>
    </div>
  );
};
