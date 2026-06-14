"use client";

import { useExplorerContext } from "@/feature/explorer/providers/explorer-provider";
import { ExplorerDialogs } from "@/feature/explorer/ui/explorer-dialogs";
import { ExplorerToolbar } from "@/feature/explorer/ui/explorer-toolbar";
import { ExplorerToolbarDialogs } from "@/feature/explorer/ui/explorer-toolbar-dialogs";
import { ScrollLockProvider } from "@/feature/general/providers/scroll-lock-provider";
import { MenuItemsProvider } from "@/feature/menu-items/providers/menu-items-provider";
import { FolderNavigation } from "@/feature/navigation/ui/folder-navigation";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheetProvider } from "@/feature/tag-editor/providers/tag-edit-sheet-provider";
import { TagEditSheet } from "@/feature/tag-editor/ui/tag-edit-sheet";
import { MediaNodePagingViewProvider } from "@/feature/view/providers/media-node-paging-view-provider";
import { PagingProvider } from "@/feature/view/providers/paging-provider";
import { PagingGridView } from "@/feature/view/ui/paging-grid-view";
import { PagingListView } from "@/feature/view/ui/paging-list-view";
import { MediaViewerProvider } from "@/feature/viewer/providers/media-viewer-provider";
import { MediaViewer } from "@/feature/viewer/ui/media-viewer";

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
      onDragEnd={({ activeNode, modifiers, overNode }) => {
        if (!overNode.isDirectory) return;
        if (modifiers.ctrlKey) {
          dialogs.moveDialog.open([activeNode], overNode.path);
        } else {
          dialogs.copyDialog.open([activeNode], overNode.path);
        }
      }}
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
