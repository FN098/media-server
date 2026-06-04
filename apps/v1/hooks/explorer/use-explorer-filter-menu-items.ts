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
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { FilterMenuItem, MenuItemDef } from "@/lib/menu-items/types";
import { useMemo } from "react";

export interface ExplorerFilterMenuContext
  extends
    FavoriteFilterMenuContext,
    FileTypeFilterMenuContext,
    RatingFilterMenuContext,
    TagFilterMenuContext {}

const items: FilterMenuItem<ExplorerFilterMenuContext>[] = [
  ...favoriteFilterMenuItems,
  ...fileTypeFilterMenuItems,
  ...ratingFilterMenuItems,
  ...tagFilterMenuItems,
];

const transformer = createRecursiveTransformer<
  MenuItemDef<ExplorerFilterMenuContext>,
  ExplorerFilterMenuContext
>(defaultFilters);

interface UseExplorerFilterMenuProps {
  context: ExplorerFilterMenuContext;
}

export function useExplorerFilterMenuItems({
  context,
}: UseExplorerFilterMenuProps) {
  return useMemo(() => transformer(items, context), [context]);
}
