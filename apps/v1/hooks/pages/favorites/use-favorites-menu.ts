import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { FavoritesFavorites } from "@/hooks/pages/favorites/use-favorites-favorites";
import { FavoritesFiltering } from "@/hooks/pages/favorites/use-favorites-filtering";
import { useFavoritesMenuItems } from "@/hooks/pages/favorites/use-favorites-menu-items";
import { FavoritesNavigation } from "@/hooks/pages/favorites/use-favorites-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { Slideshow } from "@/hooks/viewer/use-slideshow";

interface FavoritesMenuContext {
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
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
