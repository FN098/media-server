import { Fullscreen } from "@/__feature/general/hooks/use-fullscreen";
import { FavoritesFavorites } from "@/__feature/pages/favorites/hooks/use-favorites-favorites";
import { FavoritesFiltering } from "@/__feature/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesMenuItems } from "@/__feature/pages/favorites/hooks/use-favorites-menu-items";
import { FavoritesNavigation } from "@/__feature/pages/favorites/hooks/use-favorites-navigation";
import { Slideshow } from "@/__feature/viewers/media-viewer/hooks/use-slideshow";
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
