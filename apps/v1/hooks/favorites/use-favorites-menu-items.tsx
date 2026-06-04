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
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { createSeparator } from "@/lib/menu-items/factory";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";

export const separators = {
  actions: createSeparator("sep-actions"),
  tags: createSeparator("sep-tags"),
} as const;

interface UseFavoritesMenuItemsProps {
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
  tagEditor: TagEditorControl;
  navigation: FavoritesNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: FavoritesFavorites;
}

export function useFavoritesMenuItems({
  filtering,
  selection,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
}: UseFavoritesMenuItemsProps): MenuItemDef<NodeContext>[] {
  const rating = useRatingMenuItem({
    getFavorite: favorites.get,
    updateFavorite: favorites.update,
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

  return [
    rating,
    separators.actions,
    openInNewTab,
    openParentFolder,
    toggleFullscreen,
    separators.tags,
    editTags,
    addTagFilter,
  ];
}
