import { FavoritesFavorites } from "@/feature/_old/favorites/hooks/use-favorites-favorites";
import { FavoritesFiltering } from "@/feature/_old/favorites/hooks/use-favorites-filtering";
import { useFavoritesMenuItems } from "@/feature/_old/favorites/hooks/use-favorites-menu-items";
import { FavoritesNavigation } from "@/feature/_old/favorites/hooks/use-favorites-navigation";
import { Fullscreen } from "@/feature/_old/general/hooks/use-fullscreen";
import { Slideshow } from "@/feature/_old/viewers/media-viewer/hooks/use-slideshow";
import { NodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { TagEditor } from "@/feature/tag-editor/_hooks/use-tag-editor";
import { ViewerNavigation } from "@/feature/viewer/hooks/use-viewer";

interface FavoritesMenuContext {
  filtering: FavoritesFiltering;
  selection: NodeSelection;
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
