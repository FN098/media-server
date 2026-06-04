import {
  FavoriteFilterMenuContext,
  favoriteFilterMenuItems,
} from "@/lib/filter/favorite-filter";
import {
  FileTypeFilterMenuContext,
  fileTypeFilterMenuItems,
} from "@/lib/filter/file-type-filter";
import {
  RatingFilterMenuContext,
  ratingFilterMenuItems,
} from "@/lib/filter/rating-filter";
import {
  TagFilterMenuContext,
  tagFilterMenuItems,
} from "@/lib/filter/tag-filter";
import { FilterMenuItem } from "@/lib/menu-items/types";

export interface TrashFilterMenuContext
  extends
    FavoriteFilterMenuContext,
    FileTypeFilterMenuContext,
    RatingFilterMenuContext,
    TagFilterMenuContext {}

/** @todo explorer-filter-menu-items とほぼ同じなのでまとめたい */
export const trashFilterMenuItems: FilterMenuItem<TrashFilterMenuContext>[] = [
  ...favoriteFilterMenuItems,
  ...fileTypeFilterMenuItems,
  ...ratingFilterMenuItems,
  ...tagFilterMenuItems,
];
