import { TagEditor } from "@/app/(pages)/(tag-editor)/_hooks/use-tag-editor";
import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { FavoritesFavorites } from "@/feature/pages/favorites/hooks/use-favorites-favorites";
import { FavoritesFiltering } from "@/feature/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesMenuItems } from "@/feature/pages/favorites/hooks/use-favorites-menu-items";
import { FavoritesNavigation } from "@/feature/pages/favorites/hooks/use-favorites-navigation";
import { NodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { Slideshow } from "@/feature/viewers/media-viewer/hooks/use-slideshow";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";

interface FavoritesMenuContext {
  filtering: FavoritesFiltering;
  selection: NodeSelectionControl;
  tagEditor: TagEditor;
  navigation: FavoritesNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: FavoritesFavorites;
  slideshow: Slideshow;
}

export function useFavoritesMenu(props: FavoritesMenuContext) {
  const items = useFavoritesMenuItems(props);

  return {
    items,
  };
}
