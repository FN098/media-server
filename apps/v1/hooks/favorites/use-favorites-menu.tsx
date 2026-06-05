import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { useFavoritesMenuItems } from "@/hooks/favorites/use-favorites-menu-items";
import { FavoritesNavigation } from "@/hooks/favorites/use-favorites-navigation";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { Slideshow } from "@/hooks/viewer/use-slideshow";

interface FavoritesMenuContext {
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
  tagEditor: TagEditorControl;
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
