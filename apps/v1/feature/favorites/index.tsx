"use client";

import { useFavoritesContext } from "@/feature/favorites/providers/favorites-provider";
import { FavoritesToolbar } from "@/feature/favorites/ui/favorites-toolbar";
import { FavoritesToolbarDialogs } from "@/feature/favorites/ui/favorites-toolbar-dialogs";
import { ScrollLockProvider } from "@/feature/general/providers/scroll-lock-provider";
import { MenuItemsProvider } from "@/feature/menu-items/providers/menu-items-provider";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheetProvider } from "@/feature/tag-editor/providers/tag-edit-sheet-provider";
import { TagEditSheet } from "@/feature/tag-editor/ui/tag-edit-sheet";
import { PagingGridView } from "@/feature/view/components/with-paging/components/paging-grid-view";
import { PagingListView } from "@/feature/view/components/with-paging/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/feature/view/components/with-paging/providers/media-node-paging-view-provider";
import { PagingProvider } from "@/feature/view/components/with-paging/providers/paging-provider";
import { MediaViewer } from "@/feature/viewers/media-viewer";
import { MediaViewerProvider } from "@/feature/viewers/media-viewer/providers/media-viewer-provider";

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
