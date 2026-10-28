"use client";

import { ScrollLockProvider } from "@/__feature/general/providers/scroll-lock-provider";
import { MenuItemsProvider } from "@/__feature/menu-items/providers/menu-items-provider";
import { useTrashContext } from "@/__feature/pages/trash/providers/trash-provider";
import { TrashDialogs } from "@/__feature/pages/trash/ui/trash-dialogs";
import { TrashToolbar } from "@/__feature/pages/trash/ui/trash-toolbar";
import { TrashToolbarDialogs } from "@/__feature/pages/trash/ui/trash-toolbar-dialogs";
import { PagingGridView } from "@/__feature/paging-view/components/paging-grid-view";
import { PagingListView } from "@/__feature/paging-view/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/__feature/paging-view/providers/media-node-paging-view-provider";
import { PagingProvider } from "@/__feature/paging-view/providers/paging-provider";
import { MediaViewer } from "@/__feature/viewers/media-viewer";
import { MediaViewerProvider } from "@/__feature/viewers/media-viewer/providers/media-viewer-provider";
import { FolderNavigation } from "@/feature/folder-navigation/ui/folder-navigation";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheet } from "@/feature/tag-editor/_components/tag-edit-sheet";
import { TagEditSheetProvider } from "@/feature/tag-editor/_providers/tag-edit-sheet-provider";

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
      initialScrollPath={history.last?.key}
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

  return (
    <FolderNavigation prevFolder={listing.prev} nextFolder={listing.next} />
  );
}
