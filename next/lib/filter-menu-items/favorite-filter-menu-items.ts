import { FavoriteFilterMode } from "@/lib/filter/types";
import { FilterMenuItem } from "@/lib/menu-items/types";
import { StarIcon } from "lucide-react";

export interface FavoriteFilterMenuContext {
  favoriteFilterMode: FavoriteFilterMode;
  toggleFavoriteOnly(): void;
  toggleNonFavoriteOnly(): void;
}

export const favoriteFilterMenuItems: FilterMenuItem<FavoriteFilterMenuContext>[] =
  [
    {
      key: "favorite-filter-group",
      type: "group",
      label: "お気に入り",
      icon: StarIcon,
      isActive: (ctx) =>
        ["only_favorites", "exclude_favorites"].includes(
          ctx.favoriteFilterMode
        ),
      children: [
        {
          key: "favorite-only",
          type: "action",
          label: "お気に入りのみ",
          icon: StarIcon,
          iconClassName: "fill-yellow-400 text-yellow-400",
          isActive: (ctx) => ctx.favoriteFilterMode === "only_favorites",
          onClick: (ctx) => ctx.toggleFavoriteOnly(),
        },
        {
          key: "nonfavorite-only",
          type: "action",
          label: "お気に入り以外",
          icon: StarIcon,
          iconClassName: "text-muted-foreground",
          isActive: (ctx) => ctx.favoriteFilterMode === "exclude_favorites",
          onClick: (ctx) => ctx.toggleNonFavoriteOnly(),
        },
      ],
    },
  ];
