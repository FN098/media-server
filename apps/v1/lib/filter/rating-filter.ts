import { FilterMenuItem } from "@/lib/menu-items/types";
import { StarsIcon } from "lucide-react";

export interface RatingFilterMenuContext {
  hasRatingFilter: boolean;
  openRatingFilter(): void;
}

export const ratingFilterMenuItems: FilterMenuItem<RatingFilterMenuContext>[] =
  [
    {
      key: "rating-filter",
      type: "action",
      label: "評価",
      icon: StarsIcon,
      isActive: (ctx) => ctx.hasRatingFilter,
      onClick: (ctx) => ctx.openRatingFilter(),
    },
  ];
