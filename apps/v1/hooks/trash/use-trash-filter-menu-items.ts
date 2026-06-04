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
