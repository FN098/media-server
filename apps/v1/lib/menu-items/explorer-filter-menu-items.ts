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

export interface ExplorerFilterMenuContext
  extends
    FavoriteFilterMenuContext,
    FileTypeFilterMenuContext,
    RatingFilterMenuContext,
    TagFilterMenuContext {}

export const explorerFilterMenuItems: FilterMenuItem<ExplorerFilterMenuContext>[] =
  [
    ...favoriteFilterMenuItems,
    ...fileTypeFilterMenuItems,
    ...ratingFilterMenuItems,
    ...tagFilterMenuItems,
  ];
