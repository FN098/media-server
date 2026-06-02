"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ExplorerDialogs } from "@/components/ui/dialogs/explorer-dialogs";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { ExplorerToolbar } from "@/components/ui/toolbars/explorer-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerContext } from "@/providers/explorer-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { cn } from "@/shadcn/lib/utils";

export function Explorer() {
  const {
    listing,
    viewMode,
    filtering,
    selection,
    dialogs,
    viewer,
    history,
    favorites,
    navigation,
    tagEditor,
    thumbs,
    menu,
    selectionbar,
  } = useExplorerContext();

  return (
    <PagingProvider totalItems={filtering.filteredCount}>
      <MenuItemsProvider items={menu.items}>
        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
          )}
          tabIndex={-1}
        >
          {/* ツールバー */}
          {!viewer.isOpen && (
            <ExplorerToolbar
              listing={listing}
              filtering={filtering}
              dialogs={dialogs}
              favorites={favorites}
              selection={selection}
            />
          )}

          {/* グリッドビュー */}
          {viewMode.value === "grid" && !viewer.isOpen && (
            <div className="flex-1">
              <PagingGridView
                allNodes={filtering.filteredNodes}
                initialScrollPath={history.last?.path}
                onScrollRestored={navigation.onScrollRestored}
                onThumbError={(node) => void thumbs.update(node)}
                onOpen={navigation.open}
                focusOnPageChange
              />
            </div>
          )}

          {/* リストビュー */}
          {viewMode.value === "list" && !viewer.isOpen && (
            <div className="flex-1">
              <PagingListView
                allNodes={filtering.filteredNodes}
                initialScrollPath={history.last?.path}
                onScrollRestored={navigation.onScrollRestored}
                onOpen={navigation.open}
                focusOnPageChange
              />
            </div>
          )}

          {/* ビューワ */}
          {viewer.isOpen && (
            <ScrollLockProvider>
              <MediaViewer
                allNodes={filtering.mediaOnly}
                initialIndex={viewer.index}
                menuItems={menu.items}
                onIndexChange={navigation.onIndexChange}
                onClose={viewer.close}
                onOpenPrev={navigation.openPrevFolder}
                onOpenNext={navigation.openNextFolder}
                onDelete={(node) => dialogs.deleteDialog.open([node])}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
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

          {/* タグエディター */}
          <TagEditSheet
            open={tagEditor.isOpen}
            targetNodes={selection.selectedNodes}
            onClose={tagEditor.close}
            mode={tagEditor.mode}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />

          {/* ダイアログ */}
          <ExplorerDialogs dialogs={dialogs} />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
