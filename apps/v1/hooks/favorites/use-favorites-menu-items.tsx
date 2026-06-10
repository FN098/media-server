import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { FavoritesNavigation } from "@/hooks/favorites/use-favorites-navigation";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { useAddTagFilterMenuItem } from "@/hooks/menu-items/use-add-tag-filter-menu-item";
import { useEditTagsMenuItem } from "@/hooks/menu-items/use-edit-tags-menu-item";
import { useOpenInNewTabMenuItem } from "@/hooks/menu-items/use-open-in-new-tab-menu-item";
import { useOpenParentFolderMenuItem } from "@/hooks/menu-items/use-open-parent-folder-menu-item";
import { useRatingMenuItem } from "@/hooks/menu-items/use-rating-menu-item";
import { useToggleFullscreenMenuItem } from "@/hooks/menu-items/use-toggle-fullscreen-menu-item";
import { useToggleSlideshowMenuItem } from "@/hooks/menu-items/use-toggle-slideshow-menu-item";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { Slideshow } from "@/hooks/viewer/use-slideshow";
import { createSeparator } from "@/lib/menu-items/factory";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";

export const separators = {
  actions: createSeparator("sep-actions"),
  tags: createSeparator("sep-tags"),
  etc: createSeparator("sep-etc"),
} as const;

interface UseFavoritesMenuItemsProps {
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
  tagEditor: TagEditor;
  navigation: FavoritesNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: FavoritesFavorites;
  slideshow: Slideshow;
}

export function useFavoritesMenuItems({
  filtering,
  selection,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
  slideshow,
}: UseFavoritesMenuItemsProps): MenuItemDef<NodeContext>[] {
  const rating = useRatingMenuItem({
    getFavorite: favorites.get,
    updateFavorite: (props) => void favorites.update(props),
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const openParentFolder = useOpenParentFolderMenuItem({
    openParentFolder: navigation.openParentFolder,
    selectedCount: selection.selectedCount,
  });

  const openInNewTab = useOpenInNewTabMenuItem({
    openInNewTab: navigation.openInNewTab,
    selectedCount: selection.selectedCount,
  });

  const toggleFullscreen = useToggleFullscreenMenuItem({
    toggleFullscreen: fullscreen.toggle,
    isFullscreenSupported: fullscreen.isSupported,
    isViewerOpen: viewer.isOpen,
  });

  const editTags = useEditTagsMenuItem({
    openEditor: tagEditor.open,
  });

  const addTagFilter = useAddTagFilterMenuItem({
    addTagFilter: filtering.addTagFilter,
    canAddTagFilter: filtering.canAddTagFilter,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const toggleSlideshow = useToggleSlideshowMenuItem({
    toggleSlideshow: slideshow.toggle,
    isSlideshowEnabled: slideshow.enabled,
    isViewerOpen: viewer.isOpen,
  });

  return [
    rating,
    separators.actions,
    openInNewTab,
    openParentFolder,
    toggleFullscreen,
    separators.tags,
    editTags,
    addTagFilter,
    separators.etc,
    toggleSlideshow,
  ];
}
