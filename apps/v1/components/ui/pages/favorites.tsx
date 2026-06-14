"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoritesToolbarDialogs } from "@/components/ui/dialogs/favorites-toolbar-dialogs";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FavoritesToolbar } from "@/components/ui/toolbars/favorites-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { MediaNodePagingViewProvider } from "@/providers/media-node-paging-view-provider";
import { MediaViewerProvider } from "@/providers/media-viewer-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { TagEditSheetProvider } from "@/providers/tag-edit-sheet-provider";

export function Favorites() {
  const { viewer } = useFavoritesContext();

  return (
    <div className="flex flex-col focus:outline-none">
      {!viewer.isOpen && <FavoritesToolbar />}
      <FavoritesContent />
      <FavoritesOverlays />
    </div>
  );
}

function FavoritesContent() {
  const { viewer, filtering, navigation, menu } = useFavoritesContext();

  if (viewer.isOpen) {
    return (
      <ScrollLockProvider>
        <MediaViewerProvider
          allNodes={filtering.mediaOnly}
          initialIndex={viewer.index}
          menuItems={menu.items}
          onIndexChange={navigation.onIndexChange}
          onClose={viewer.close}
        >
          <MediaViewer />
        </MediaViewerProvider>
      </ScrollLockProvider>
    );
  }

  return (
    <MenuItemsProvider items={menu.items}>
      <PagingProvider totalCount={filtering.filteredCount}>
        <FavoritesListingView />
      </PagingProvider>
    </MenuItemsProvider>
  );
}

function FavoritesListingView() {
  const { viewMode, filtering, history, navigation, thumbs } =
    useFavoritesContext();

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

function FavoritesOverlays() {
  const { filtering, selection, tagEditor, selectionbar, viewer } =
    useFavoritesContext();

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

      {!viewer.isOpen && <FavoritesToolbarDialogs />}
    </>
  );
}
