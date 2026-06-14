"use client";

import { ScrollLockProvider } from "@/feature/general/providers/scroll-lock-provider";
import { MenuItemsProvider } from "@/feature/menu-items/providers/menu-items-provider";
import { FolderNavigation } from "@/feature/navigation/ui/folder-navigation";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheetProvider } from "@/feature/tag-editor/providers/tag-edit-sheet-provider";
import { TagEditSheet } from "@/feature/tag-editor/ui/tag-edit-sheet";
import { useTrashContext } from "@/feature/trash/providers/trash-provider";
import { TrashDialogs } from "@/feature/trash/ui/trash-dialogs";
import { TrashToolbar } from "@/feature/trash/ui/trash-toolbar";
import { TrashToolbarDialogs } from "@/feature/trash/ui/trash-toolbar-dialogs";
import { MediaNodePagingViewProvider } from "@/feature/view/providers/media-node-paging-view-provider";
import { PagingProvider } from "@/feature/view/providers/paging-provider";
import { PagingGridView } from "@/feature/view/ui/paging-grid-view";
import { PagingListView } from "@/feature/view/ui/paging-list-view";
import { MediaViewerProvider } from "@/feature/viewer/providers/media-viewer-provider";
import { MediaViewer } from "@/feature/viewer/ui/media-viewer";

export function Trash() {
  const { viewer } = useTrashContext();

  return (
    <div className="flex flex-col focus:outline-none">
      {!viewer.isOpen && <TrashToolbar />}
      <TrashContent />
      <TrashOverlays />
      {!viewer.isOpen && <TrashFolderNavigation />}
    </div>
  );
}

function TrashContent() {
  const { viewer, filtering, navigation, menu, dialogs } = useTrashContext();

  if (viewer.isOpen) {
    return (
      <ScrollLockProvider>
        <MediaViewerProvider
          allNodes={filtering.mediaOnly}
          initialIndex={viewer.index}
          menuItems={menu.items}
          onIndexChange={navigation.onIndexChange}
          onClose={viewer.close}
          onOpenPrev={navigation.openPrevFolder}
          onOpenNext={navigation.openNextFolder}
          onDelete={(node) => dialogs.deleteDialog.open([node])}
        >
          <MediaViewer />
        </MediaViewerProvider>
      </ScrollLockProvider>
    );
  }

  return (
    <MenuItemsProvider items={menu.items}>
      <PagingProvider totalCount={filtering.filteredCount}>
        <TrashListingView />
      </PagingProvider>
    </MenuItemsProvider>
  );
}

function TrashListingView() {
  const { viewMode, filtering, history, navigation, thumbs } =
    useTrashContext();

  return (
    <MediaNodePagingViewProvider
      allNodes={filtering.filteredNodes}
      initialScrollPath={history.last?.path}
      onScrollRestored={navigation.onScrollRestored}
      onThumbError={(node) => void thumbs.update(node)}
      onOpen={(node) => void navigation.open(node)}
      focusOnPageChange
    >
      {viewMode.value === "grid" && <PagingGridView />}
      {viewMode.value === "list" && <PagingListView />}
    </MediaNodePagingViewProvider>
  );
}

function TrashOverlays() {
  const { filtering, selection, tagEditor, selectionbar, viewer } =
    useTrashContext();

  return (
    <>
      <SelectionBar
        open={selection.isSelectionMode && !tagEditor.isOpen}
        count={selection.selectedCount}
        totalCount={filtering.filteredCount}
        onSelectAll={selection.selectAll}
        onClose={selection.reset}
        className="z-40" // DropdownMenu より小さくする
        context={{ nodes: selection.selectedNodes }}
        menuItems={selectionbar.menu.items}
        inlineMenuItems={selectionbar.menu.inlineItems}
      />

      <TagEditSheetProvider
        tagEditor={tagEditor}
        targetNodes={selection.selectedNodes}
      >
        <TagEditSheet />
      </TagEditSheetProvider>

      <TrashDialogs />

      {!viewer.isOpen && <TrashToolbarDialogs />}
    </>
  );
}

function TrashFolderNavigation() {
  const { listing } = useTrashContext();

  return <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />;
}
