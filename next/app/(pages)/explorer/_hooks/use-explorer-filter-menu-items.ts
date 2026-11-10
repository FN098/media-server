import { defaultFilters } from "@/feature/menu-items/lib/filters";
import { createRecursiveTransformer } from "@/feature/menu-items/lib/transformers";
import { FilterMenuItem, MenuItemDef } from "@/feature/menu-items/lib/types";
import {
    FavoriteFilterMenuContext,
    favoriteFilterMenuItems,
} from "@/lib/_old/filter-menu-items/favorite-filter-menu-items";
import {
    FileTypeFilterMenuContext,
    fileTypeFilterMenuItems,
} from "@/lib/_old/filter-menu-items/file-type-filter-menu-items";
import {
    TagFilterMenuContext,
    tagFilterMenuItems,
} from "@/lib/_old/filter-menu-items/tag-filter-menu-items";
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
