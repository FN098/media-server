import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Star } from "lucide-react";

interface FavoriteFilterButtonProps {
  isActive: boolean;
  onClick: () => void;
  count?: number; // お気に入り件数（任意）
  showCount?: boolean; // 件数を表示するかどうか
}

export const FavoriteFilterButton = ({
  isActive,
  onClick,
  count = 0,
  showCount = false,
}: FavoriteFilterButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 h-9 transition-colors",
        isActive
          ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
          : "text-muted-foreground"
      )}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all",
          isActive && "fill-yellow-400 text-yellow-400"
        )}
      />
      <span>お気に入りのみ</span>

      {isActive && showCount && count > 0 && (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={cn(
            "ml-1 px-1.5 h-5 min-w-[20px] justify-center transition-colors font-normal",
            !isActive && "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  );
};
