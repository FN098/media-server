import { useMounted } from "@/hooks/use-mounted";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, Sparkles } from "lucide-react";

export const FolderStatusBadge = ({
  date,
  className,
}: {
  date?: Date | string | null;
  className?: string;
}) => {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <Skeleton
        className={cn("h-5 w-[72px] rounded-sm bg-muted border", className)}
      />
    );
  }

  if (!date) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-sm text-[10px] shadow-sm animate-pulse w-fit",
          className
        )}
      >
        <Sparkles size={10} fill="currentColor" />
        <span>NEW</span>
      </div>
    );
  }

  const lastDate = new Date(date);
  const now = new Date();
  const diffInDays =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  const isRecent = diffInDays < 1;
  const colorClass = isRecent
    ? "bg-blue-500 text-white"
    : "bg-muted text-muted-foreground border";

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] w-fit",
        colorClass,
        className
      )}
    >
      <Clock size={10} />
      <span className="whitespace-nowrap">
        {formatDistanceToNow(lastDate, { addSuffix: true, locale: ja })}
      </span>
    </div>
  );
};
