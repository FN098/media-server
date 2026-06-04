import { FavoritesDialogs } from "@/hooks/favorites/use-favorites-dialogs";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { MediaListing } from "@/lib/media/types";
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

const actionMenuItems: MenuItemDef<FavoritesActionMenuContext>[] = [];

export function useFavoritesActionMenu() {
  const { listing, filtering, dialogs } = useFavoritesContext();

  const isMobile = useIsMobile();

  const context = useMemo(() => {
    return {
      listing,
      filtering,
      dialogs,
      isMobile,
    };
  }, [filtering, listing, dialogs, isMobile]);

  return {
    items: actionMenuItems,
    context,
  };
}
