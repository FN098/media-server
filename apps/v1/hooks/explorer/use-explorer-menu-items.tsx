import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { ExplorerNavigation } from "@/hooks/explorer/use-explorer-navigation";
import { ExplorerThumbs } from "@/hooks/explorer/use-explorer-thumbs";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { useAddTagFilterMenuItem } from "@/hooks/menu-items/use-add-tag-filter-menu-item";
import { useCopyMenuItem } from "@/hooks/menu-items/use-copy-menu-item";
import { useDeleteMenuItem } from "@/hooks/menu-items/use-delete-menu-item";
import { useEditTagsMenuItem } from "@/hooks/menu-items/use-edit-tags-menu-item";
import { useExtractArchiveMenuItem } from "@/hooks/menu-items/use-extract-archive-menu-item";
import { useMoveMenuItem } from "@/hooks/menu-items/use-move-menu-item";
import { useOpenInNewTabMenuItem } from "@/hooks/menu-items/use-open-in-new-tab-menu-item";
import { useOpenNextFolderMenuItem } from "@/hooks/menu-items/use-open-next-folder-menu-item";
import { useOpenPrevFolderMenuItem } from "@/hooks/menu-items/use-open-prev-folder-menu-item";
import { useRatingMenuItem } from "@/hooks/menu-items/use-rating-menu-item";
import { useRenameMenuItem } from "@/hooks/menu-items/use-rename-menu-item";
import { useSetAsPreviewMenuItem } from "@/hooks/menu-items/use-set-as-preview-menu-item";
import { useToggleFullscreenMenuItem } from "@/hooks/menu-items/use-toggle-fullscreen-menu-item";
import { useToggleSlideshowMenuItem } from "@/hooks/menu-items/use-toggle-slideshow-menu-item";
import { useUpdateThumbMenuItem } from "@/hooks/menu-items/use-update-thumb-menu-item";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { Slideshow } from "@/hooks/viewer/use-slideshow";
import { MediaListing } from "@/lib/media/types";
import { createSeparator } from "@/lib/menu-items/factory";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";

export const separators = {
  actions: createSeparator("sep-actions"),
  file: createSeparator("sep-file"),
  tags: createSeparator("sep-tags"),
  etc: createSeparator("sep-etc"),
  delete: createSeparator("sep-delete"),
} as const;

interface UseExplorerMenuItemsProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: MediaNodeSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
  slideshow: Slideshow;
}

export function useExplorerMenuItems({
  listing,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
  thumbs,
  slideshow,
}: UseExplorerMenuItemsProps): MenuItemDef<NodeContext>[] {
  const rating = useRatingMenuItem({
    getFavorite: favorites.get,
    updateFavorite: (props) => void favorites.update(props),
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const openInNewTab = useOpenInNewTabMenuItem({
    openInNewTab: navigation.openInNewTab,
    selectedCount: selection.selectedCount,
  });

  const openNextFolder = useOpenNextFolderMenuItem({
    openNextFolder: navigation.openNextFolder,
    isViewerOpen: viewer.isOpen,
  });

  const openPrevFolder = useOpenPrevFolderMenuItem({
    openPrevFolder: navigation.openPrevFolder,
    isViewerOpen: viewer.isOpen,
  });

  const toggleFullscreen = useToggleFullscreenMenuItem({
    toggleFullscreen: fullscreen.toggle,
    isFullscreenSupported: fullscreen.isSupported,
    isViewerOpen: viewer.isOpen,
  });

  const extractArchive = useExtractArchiveMenuItem({
    openDialog: dialogs.extractDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const rename = useRenameMenuItem({
    openDialog: dialogs.renameDialog.open,
    selectedCount: selection.selectedCount,
  });

  const move = useMoveMenuItem({
    openDialog: dialogs.moveDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
    currentDirPath: listing.path,
  });

  const copy = useCopyMenuItem({
    openDialog: dialogs.copyDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
    currentDirPath: listing.path,
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

  const setAsPreview = useSetAsPreviewMenuItem({
    openDialog: dialogs.previewDialog.open,
    selectedCount: selection.selectedCount,
  });

  const updateThumb = useUpdateThumbMenuItem({
    updateThumb: thumbs.update,
    updateThumbs: thumbs.updateParallel,
    isViewerOpen: viewer.isOpen,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const toggleSlideshow = useToggleSlideshowMenuItem({
    toggleSlideshow: slideshow.toggle,
    isSlideshowEnabled: slideshow.enabled,
    isViewerOpen: viewer.isOpen,
  });

  const deleteNode = useDeleteMenuItem({
    openDialog: dialogs.deleteDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  // TODO: transformer

  return [
    rating,
    separators.actions,
    openInNewTab,
    openNextFolder,
    openPrevFolder,
    toggleFullscreen,
    separators.file,
    extractArchive,
    rename,
    move,
    copy,
    separators.tags,
    editTags,
    addTagFilter,
    separators.etc,
    setAsPreview,
    updateThumb,
    toggleSlideshow,
    separators.delete,
    deleteNode,
  ];
}
