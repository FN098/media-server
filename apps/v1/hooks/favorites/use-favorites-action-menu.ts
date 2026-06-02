import { FavoritesDialogs } from "@/hooks/favorites/use-favorites-dialogs";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";

interface FavoritesActionMenuContext {
  listing: MediaListing;
  filtering: FavoritesFiltering;
  dialogs: FavoritesDialogs;
  isMobile: boolean;
}

const actionMenuItems: MenuItemDef<FavoritesActionMenuContext>[] = [];

export function useFavoritesActionMenu() {
  return { items: actionMenuItems };
}
