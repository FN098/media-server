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
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { FilterMenuItem, MenuItemDef } from "@/lib/menu-items/types";
import { useMemo } from "react";

export interface FavoritesFilterMenuContext
  extends
    FileTypeFilterMenuContext,
    RatingFilterMenuContext,
    TagFilterMenuContext {}

const items: FilterMenuItem<FavoritesFilterMenuContext>[] = [
  ...fileTypeFilterMenuItems,
  ...ratingFilterMenuItems,
  ...tagFilterMenuItems,
];

const transformer = createRecursiveTransformer<
  MenuItemDef<FavoritesFilterMenuContext>,
  FavoritesFilterMenuContext
>(defaultFilters);

interface UseFavoritesFilterMenuItemsProps {
  context: FavoritesFilterMenuContext;
}

export function useFavoritesFilterMenuItems({
  context,
}: UseFavoritesFilterMenuItemsProps) {
  return useMemo(() => transformer(items, context), [context]);
}
