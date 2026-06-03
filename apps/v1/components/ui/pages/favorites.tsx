"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoritesToolbarDialogs } from "@/components/ui/dialogs/favorites-toolbar-dialogs";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FavoritesToolbar } from "@/components/ui/toolbars/favorites-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { cn } from "@/shadcn/lib/utils";

export function Favorites() {
  const { viewer } = useFavoritesContext();

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
      )}
      tabIndex={-1}
    >
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
        <MediaViewer
          allNodes={filtering.mediaOnly}
          initialIndex={viewer.index}
          menuItems={menu.items}
          onIndexChange={navigation.onIndexChange}
          onClose={viewer.close}
        />
      </ScrollLockProvider>
    );
  }

  return (
    <div className="flex-1">
      <MenuItemsProvider items={menu.items}>
        <PagingProvider totalItems={filtering.filteredCount}>
          <FavoritesListingView />
        </PagingProvider>
      </MenuItemsProvider>
    </div>
  );
}

function FavoritesListingView() {
  const { viewMode, filtering, history, navigation, thumbs } =
    useFavoritesContext();

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

      <TagEditSheet
        open={tagEditor.isOpen}
        targetNodes={selection.selectedNodes}
        onClose={tagEditor.close}
        mode={tagEditor.mode}
      />

      {!viewer.isOpen && <FavoritesToolbarDialogs />}
    </>
  );
}
