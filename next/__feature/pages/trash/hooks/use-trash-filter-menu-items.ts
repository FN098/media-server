import {
  FavoriteFilterMenuContext,
  favoriteFilterMenuItems,
} from "@/__lib/filter-menu-items/favorite-filter-menu-items";
import {
  FileTypeFilterMenuContext,
  fileTypeFilterMenuItems,
} from "@/__lib/filter-menu-items/file-type-filter-menu-items";
import {
  TagFilterMenuContext,
  tagFilterMenuItems,
} from "@/__lib/filter-menu-items/tag-filter-menu-items";
import { defaultFilters } from "@/__lib/menu-items/filters";
import { createRecursiveTransformer } from "@/__lib/menu-items/transformer";
import { FilterMenuItem, MenuItemDef } from "@/__lib/menu-items/types";
import {
  RatingFilterMenuContext,
  ratingFilterMenuItems,
} from "@/lib/filter-menu-items/rating-filter-menu-items";
import { useMemo } from "react";

export interface TrashFilterMenuContext
  extends
    FavoriteFilterMenuContext,
    FileTypeFilterMenuContext,
    RatingFilterMenuContext,
    TagFilterMenuContext {}

const items: FilterMenuItem<TrashFilterMenuContext>[] = [
  ...favoriteFilterMenuItems,
  ...fileTypeFilterMenuItems,
  ...ratingFilterMenuItems,
  ...tagFilterMenuItems,
];

const transformer = createRecursiveTransformer<
  MenuItemDef<TrashFilterMenuContext>,
  TrashFilterMenuContext
>(defaultFilters);

interface UseTrashFilterMenuProps {
  context: TrashFilterMenuContext;
}

export function useTrashFilterMenuItems({ context }: UseTrashFilterMenuProps) {
  return useMemo(() => transformer(items, context), [context]);
}
