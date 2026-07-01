import { FavoritesFavorites } from "@/feature/favorites/hooks/use-favorites-favorites";
import { FavoritesFiltering } from "@/feature/favorites/hooks/use-favorites-filtering";
import { FavoritesNavigation } from "@/feature/favorites/hooks/use-favorites-navigation";
import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { useAddTagFilterMenuItem } from "@/feature/menu-items/hooks/use-add-tag-filter-menu-item";
import { useEditTagsMenuItem } from "@/feature/menu-items/hooks/use-edit-tags-menu-item";
import { useOpenInNewTabMenuItem } from "@/feature/menu-items/hooks/use-open-in-new-tab-menu-item";
import { useOpenParentFolderMenuItem } from "@/feature/menu-items/hooks/use-open-parent-folder-menu-item";
import { useRatingMenuItem } from "@/feature/menu-items/hooks/use-rating-menu-item";
import { useToggleFullscreenMenuItem } from "@/feature/menu-items/hooks/use-toggle-fullscreen-menu-item";
import { useToggleSlideshowMenuItem } from "@/feature/menu-items/hooks/use-toggle-slideshow-menu-item";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { TagEditor } from "@/feature/tag-editor/hooks/use-tag-editor";
import { Slideshow } from "@/feature/viewers/media-viewer/hooks/use-slideshow";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
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
