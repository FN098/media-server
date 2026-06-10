"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ExplorerDialogs } from "@/components/ui/dialogs/explorer-dialogs";
import { ExplorerToolbarDialogs } from "@/components/ui/dialogs/explorer-toolbar-dialogs";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { ExplorerToolbar } from "@/components/ui/toolbars/explorer-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerContext } from "@/providers/explorer-provider";
import { MediaViewerProvider } from "@/providers/media-viewer-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";

export function Explorer() {
  const { viewer } = useExplorerContext();

  return (
    <div className="flex flex-col focus:outline-none" tabIndex={-1}>
      {!viewer.isOpen && <ExplorerToolbar />}
      <ExplorerContent />
      <ExplorerOverlays />
      {!viewer.isOpen && <ExplorerFolderNavigation />}
    </div>
  );
}

function ExplorerContent() {
  const { viewer, filtering, navigation, menu, dialogs } = useExplorerContext();

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
        <ExplorerListingView />
      </PagingProvider>
    </MenuItemsProvider>
  );
}

function ExplorerListingView() {
  const { viewMode, filtering, history, navigation, thumbs } =
    useExplorerContext();

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

function ExplorerOverlays() {
  const { filtering, selection, tagEditor, selectionbar, viewer } =
    useExplorerContext();

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

      <ExplorerDialogs />

      {!viewer.isOpen && <ExplorerToolbarDialogs />}
    </>
  );
}

function ExplorerFolderNavigation() {
  const { listing } = useExplorerContext();

  return <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />;
}
