import { FavoritesDialogs } from "@/hooks/favorites/use-favorites-dialogs";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { MediaListing } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { useMemo } from "react";

interface FavoritesActionMenuContext {
  listing: MediaListing;
  filtering: FavoritesFiltering;
  dialogs: FavoritesDialogs;
  isMobile: boolean;
}

const actionMenuItems: MenuItemDef<FavoritesActionMenuContext>[] = [
  // メニューをここに追加
];

const transformer = createRecursiveTransformer<
  MenuItemDef<FavoritesActionMenuContext>,
  FavoritesActionMenuContext
>(defaultFilters);

export function useFavoritesActionMenu() {
  const { listing, filtering, dialogs } = useFavoritesContext();

  const isMobile = useIsMobile();

  const context = useMemo(() => {
    return {
      listing,
      filtering,
      dialogs,
      isMobile,
    } satisfies FavoritesActionMenuContext;
  }, [filtering, listing, dialogs, isMobile]);

  const transformed = useMemo(
    () => transformer(actionMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
