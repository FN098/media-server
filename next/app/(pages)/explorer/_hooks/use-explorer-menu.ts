import { Fullscreen } from "@/__feature/general/hooks/use-fullscreen";
import { useAddTagFilterMenuItem } from "@/__feature/menu-items/hooks/use-add-tag-filter-menu-item";
import { useCopyMenuItem } from "@/__feature/menu-items/hooks/use-copy-menu-item";
import { useDeleteMenuItem } from "@/__feature/menu-items/hooks/use-delete-menu-item";
import { useEditTagsMenuItem } from "@/__feature/menu-items/hooks/use-edit-tags-menu-item";
import { useExtractArchiveMenuItem } from "@/__feature/menu-items/hooks/use-extract-archive-menu-item";
import { useMoveMenuItem } from "@/__feature/menu-items/hooks/use-move-menu-item";
import { useOpenInNewTabMenuItem } from "@/__feature/menu-items/hooks/use-open-in-new-tab-menu-item";
import { useOpenNextFolderMenuItem } from "@/__feature/menu-items/hooks/use-open-next-folder-menu-item";
import { useOpenPrevFolderMenuItem } from "@/__feature/menu-items/hooks/use-open-prev-folder-menu-item";
import { useRenameMenuItem } from "@/__feature/menu-items/hooks/use-rename-menu-item";
import { useSetAsPreviewMenuItem } from "@/__feature/menu-items/hooks/use-set-as-preview-menu-item";
import { useToggleFullscreenMenuItem } from "@/__feature/menu-items/hooks/use-toggle-fullscreen-menu-item";
import { useToggleSlideshowMenuItem } from "@/__feature/menu-items/hooks/use-toggle-slideshow-menu-item";
import { useUpdateThumbMenuItem } from "@/__feature/menu-items/hooks/use-update-thumb-menu-item";
import { NodeSelectionControl } from "@/__feature/selection/hooks/use-node-selection-control";
import { Slideshow } from "@/__feature/viewers/media-viewer/hooks/use-slideshow";
import { SeparatorMenuItem } from "@/__lib/menu-items/types";
import { ExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { ExplorerNavigation } from "@/app/(pages)/explorer/_hooks/use-explorer-navigation";
import { ExplorerThumbs } from "@/app/(pages)/explorer/_hooks/use-explorer-thumbs";
import { TagEditor } from "@/feature/tag-editor/_hooks/use-tag-editor";
import { ViewerNavigation } from "@/feature/viewer/hooks/use-viewer";
import { NodeListing } from "@/lib/node/types";

function createSeparator<T>(key: string): SeparatorMenuItem<T> {
  return { key, type: "separator" };
}

const separators = {
  actions: createSeparator("sep-actions"),
  file: createSeparator("sep-file"),
  tags: createSeparator("sep-tags"),
  etc: createSeparator("sep-etc"),
  delete: createSeparator("sep-delete"),
} as const;

interface UseExplorerMenuProps {
  listing: NodeListing;
  filtering: ExplorerFiltering;
  selection: NodeSelectionControl;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditor;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  thumbs: ExplorerThumbs;
  slideshow: Slideshow;
}

export function useExplorerMenu({
  listing,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  thumbs,
  slideshow,
}: UseExplorerMenuProps) {
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

  const items = [
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

  return {
    items,
  };
}
