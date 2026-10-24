import {
  FavoriteFilterMenuContext,
  favoriteFilterMenuItems,
} from "@/lib/filter-menu-items/favorite-filter-menu-items";
import {
  FileTypeFilterMenuContext,
  fileTypeFilterMenuItems,
} from "@/lib/filter-menu-items/file-type-filter-menu-items";
import {
  TagFilterMenuContext,
  tagFilterMenuItems,
} from "@/lib/filter-menu-items/tag-filter-menu-items";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { FilterMenuItem, MenuItemDef } from "@/lib/menu-items/types";
import { useMemo } from "react";

export interface ExplorerFilterMenuContext
  extends
    FavoriteFilterMenuContext,
    FileTypeFilterMenuContext,
    TagFilterMenuContext {}

const items: FilterMenuItem<ExplorerFilterMenuContext>[] = [
  ...favoriteFilterMenuItems,
  ...fileTypeFilterMenuItems,
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
