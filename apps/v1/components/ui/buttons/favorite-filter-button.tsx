import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { LayoutGrid, Star, StarOff } from "lucide-react";

export type FavoriteFilterMode = "all" | "only_favorites" | "exclude_favorites";

interface FavoriteFilterButtonProps {
  mode: FavoriteFilterMode;
  onChange: (nextMode: FavoriteFilterMode) => void;
}

export const FavoriteFilterButton = ({
  mode,
  onChange,
}: FavoriteFilterButtonProps) => {
  // ループのロジック
  const handleToggle = () => {
    const modes: FavoriteFilterMode[] = [
      "all",
      "only_favorites",
      "exclude_favorites",
    ];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onChange(modes[nextIndex]);
  };

  // 表示内容の出し分け
  const config = {
    all: {
      label: "すべて",
      icon: <LayoutGrid className="h-4 w-4" />,
      className: "border-primary bg-primary/5 text-primary hover:bg-primary/10",
    },
    only_favorites: {
      label: "お気に入りのみ",
      icon: <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />,
      className: "border-primary bg-primary/5 text-primary hover:bg-primary/10",
    },
    exclude_favorites: {
      label: "お気に入り以外",
      icon: <StarOff className="h-4 w-4" />,
      className: "border-primary bg-primary/5 text-primary hover:bg-primary/10",
    },
  };

  const current = config[mode];

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="sm"
      className={cn("gap-2 h-9 w-[160px] transition-colors", current.className)}
    >
      {current.icon}
      <span>{current.label}</span>
    </Button>
  );
};
