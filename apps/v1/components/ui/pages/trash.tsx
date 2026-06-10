"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { TrashDialogs } from "@/components/ui/dialogs/trash-dialogs";
import { TrashToolbarDialogs } from "@/components/ui/dialogs/trash-toolbar-dialogs";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { TrashToolbar } from "@/components/ui/toolbars/trash-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { MediaViewerProvider } from "@/providers/media-viewer-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useTrashContext } from "@/providers/trash-provider";

export function Trash() {
  const { viewer } = useTrashContext();

  return (
    <div className="flex flex-col focus:outline-none" tabIndex={-1}>
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

  if (viewMode.value === "grid") {
    return (
      <PagingGridView
        allNodes={filtering.filteredNodes}
        initialScrollPath={history.last?.path}
        onScrollRestored={navigation.onScrollRestored}
        onThumbError={(node) => void thumbs.update(node)}
        onOpen={navigation.open}
        focusOnPageChange
      />
    );
  }

  return (
    <PagingListView
      allNodes={filtering.filteredNodes}
      initialScrollPath={history.last?.path}
      onScrollRestored={navigation.onScrollRestored}
      onOpen={navigation.open}
      focusOnPageChange
    />
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

      <TagEditSheet
        open={tagEditor.isOpen}
        targetNodes={selection.selectedNodes}
        onClose={tagEditor.close}
        mode={tagEditor.mode}
      />

      <TrashDialogs />

      {!viewer.isOpen && <TrashToolbarDialogs />}
    </>
  );
}

function TrashFolderNavigation() {
  const { listing } = useTrashContext();

  return <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />;
}
