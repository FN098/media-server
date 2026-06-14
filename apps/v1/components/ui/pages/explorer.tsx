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
import { ScrollLockProvider } from "@/providers/general/scroll-lock-provider";
import { MenuItemsProvider } from "@/providers/menu-items/menu-items-provider";
import { PagingProvider } from "@/providers/navigation/paging-provider";
import { useExplorerContext } from "@/providers/pages/explorer-provider";
import { TagEditSheetProvider } from "@/providers/tag-editor/tag-edit-sheet-provider";
import { MediaNodePagingViewProvider } from "@/providers/view/media-node-paging-view-provider";
import { MediaViewerProvider } from "@/providers/viewer/media-viewer-provider";

export function Explorer() {
  const { viewer } = useExplorerContext();

  return (
    <div className="flex flex-col focus:outline-none">
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
  const { viewMode, filtering, history, navigation, thumbs, dialogs } =
    useExplorerContext();

  return (
    <MediaNodePagingViewProvider
      allNodes={filtering.filteredNodes}
      initialScrollPath={history.last?.path}
      onScrollRestored={navigation.onScrollRestored}
      onThumbError={(node) => void thumbs.update(node)}
      onOpen={(node) => void navigation.open(node)}
      onMoveNode={(node, targetFolderNode) =>
        dialogs.moveDialog.open([node], targetFolderNode.path)
      }
      focusOnPageChange
    >
      {viewMode.value === "grid" && <PagingGridView />}
      {viewMode.value === "list" && <PagingListView />}
    </MediaNodePagingViewProvider>
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

      <TagEditSheetProvider
        tagEditor={tagEditor}
        targetNodes={selection.selectedNodes}
      >
        <TagEditSheet />
      </TagEditSheetProvider>

      <ExplorerDialogs />

      {!viewer.isOpen && <ExplorerToolbarDialogs />}
    </>
  );
}

function ExplorerFolderNavigation() {
  const { listing } = useExplorerContext();

  return <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />;
}
