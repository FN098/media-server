import { ExplorerDialogs } from "@/feature/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/feature/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/feature/explorer/hooks/use-explorer-filtering";
import { ExplorerNavigation } from "@/feature/explorer/hooks/use-explorer-navigation";
import { ExplorerThumbs } from "@/feature/explorer/hooks/use-explorer-thumbs";
import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { useAddTagFilterMenuItem } from "@/feature/menu-items/hooks/use-add-tag-filter-menu-item";
import { useCopyMenuItem } from "@/feature/menu-items/hooks/use-copy-menu-item";
import { useDeleteMenuItem } from "@/feature/menu-items/hooks/use-delete-menu-item";
import { useEditTagsMenuItem } from "@/feature/menu-items/hooks/use-edit-tags-menu-item";
import { useExtractArchiveMenuItem } from "@/feature/menu-items/hooks/use-extract-archive-menu-item";
import { useMoveMenuItem } from "@/feature/menu-items/hooks/use-move-menu-item";
import { useOpenInNewTabMenuItem } from "@/feature/menu-items/hooks/use-open-in-new-tab-menu-item";
import { useOpenNextFolderMenuItem } from "@/feature/menu-items/hooks/use-open-next-folder-menu-item";
import { useOpenPrevFolderMenuItem } from "@/feature/menu-items/hooks/use-open-prev-folder-menu-item";
import { useRatingMenuItem } from "@/feature/menu-items/hooks/use-rating-menu-item";
import { useRenameMenuItem } from "@/feature/menu-items/hooks/use-rename-menu-item";
import { useSetAsPreviewMenuItem } from "@/feature/menu-items/hooks/use-set-as-preview-menu-item";
import { useToggleFullscreenMenuItem } from "@/feature/menu-items/hooks/use-toggle-fullscreen-menu-item";
import { useToggleSlideshowMenuItem } from "@/feature/menu-items/hooks/use-toggle-slideshow-menu-item";
import { useUpdateThumbMenuItem } from "@/feature/menu-items/hooks/use-update-thumb-menu-item";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { TagEditor } from "@/feature/tag-editor/hooks/use-tag-editor";
import { Slideshow } from "@/feature/viewers/media-viewer/hooks/use-slideshow";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
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
  tagEditor: TagEditor;
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
