"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { ExplorerDialogs } from "@/components/ui/pages/components/explorer-dialogs";
import { ExplorerToolbar } from "@/components/ui/pages/components/explorer-toolbar";
import { useExplorerDialogs } from "@/components/ui/pages/hooks/use-explorer-dialogs";
import { useExplorerFavorites } from "@/components/ui/pages/hooks/use-explorer-favorites";
import { useExplorerFiltering } from "@/components/ui/pages/hooks/use-explorer-filtering";
import { useExplorerHotkeys } from "@/components/ui/pages/hooks/use-explorer-hotkeys";
import { useExplorerMenu } from "@/components/ui/pages/hooks/use-explorer-menu";
import { useExplorerNavigation } from "@/components/ui/pages/hooks/use-explorer-navigation";
import { useExplorerSelection } from "@/components/ui/pages/hooks/use-explorer-selection";
import { useExplorerSelectionbar } from "@/components/ui/pages/hooks/use-explorer-selectionbar";
import { useExplorerSort } from "@/components/ui/pages/hooks/use-explorer-sort";
import { useExplorerThumbs } from "@/components/ui/pages/hooks/use-explorer-thumb";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useTagEditorControl } from "@/hooks/use-tag-editor-control";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerNavigation } from "@/hooks/use-viewer-control";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { cn } from "@/shadcn/lib/utils";

interface ExplorerProps {
  listing: MediaListing;
}

export function Explorer({ listing }: ExplorerProps) {
  // ===== 検索 =====

  const searchFocus = useSearchFocusContext();

  // ===== ビューモード =====

  const viewMode = useViewMode();

  // ===== 並び替え =====

  const sort = useExplorerSort();

  // ===== フィルタリング =====

  const filtering = useExplorerFiltering({ listing });

  // ===== 選択 =====

  const selection = useExplorerSelection({
    listing,
    filtering,
  });

  // ===== ナビゲーション =====

  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation({});
  const history = useHistoryContext();
  const navigation = useExplorerNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
  });

  // ===== お気に入り =====

  const favorites = useExplorerFavorites({
    targetNodes: selection.selectedNodes,
  });

  // ===== タグエディタ =====

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

  // ===== ダイアログ =====

  const dialogs = useExplorerDialogs({
    currentDir: listing.path,
    selectedNodes: selection.selectedNodes,
    clearSelection: selection.reset,
  });

  const {
    deleteDialog,
    renameDialog,
    extractDialog,
    favoriteDialog,
    previewDialog,
    moveDialog,
    copyDialog,
  } = dialogs;

  // ===== サムネイル =====

  const thumbs = useExplorerThumbs({
    currentDir: listing.path,
    selectedNodes: selection.selectedNodes,
  });

  // ===== フルスクリーン =====

  const fullscreen = useFullscreen();

  // ===== キーボードショートカット =====

  useExplorerHotkeys({
    enabled: true,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    searchFocus,
  });

  // ===== 右クリックメニュー/ドロップダウンメニュー =====

  const menu = useExplorerMenu({
    hasSelection: selection.hasSelection,
    selectedCount: selection.selectedCount,
    isViewerMode: viewer.isOpen,
    isFullscreenSupported: fullscreen.isSupported,
    getFavorite: favorites.get,
    onOpenInNewTab: navigation.openInNewTab,
    onExtract: extractDialog.open,
    onExtractSelected: extractDialog.openSelected,
    onChangeRating: favorites.update,
    onChangeRatingSelected: favorites.updateSelected,
    onToggleFullscreen: () => void fullscreen.toggle(),
    onRename: renameDialog.open,
    onMove: moveDialog.open,
    onMoveSelected: moveDialog.openSelected,
    onCopy: copyDialog.open,
    onCopySelected: copyDialog.openSelected,
    onEditTags: tagEditor.open,
    onAddTagsToFilter: filtering.addTagFilter,
    onApplyAsPreview: previewDialog.open,
    onUpdateThumb: (node) => void thumbs.update(node),
    onUpdateThumbSelected: () => void thumbs.updateSelected(),
    onDelete: deleteDialog.open,
    onDeleteSelected: deleteDialog.openSelected,
  });

  // ===== 選択バー =====

  const selectionbar = useExplorerSelectionbar({
    hasSelection: selection.hasSelection,
    onChangeRating: favorites.update,
    onChangeRatingSelected: favorites.updateSelected,
    onMoveSelected: moveDialog.openSelected,
    onCopySelected: copyDialog.openSelected,
    onEditTagsSelected: tagEditor.open,
    onUpdateThumbSelected: () => void thumbs.updateSelected(),
    onDeleteSelected: deleteDialog.openSelected,
    onAddFavoriteSelected: () => favoriteDialog.openSelected({ mode: "add" }),
    onRemoveFavoriteSelected: () =>
      favoriteDialog.openSelected({ mode: "remove" }),
  });

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
          <ExplorerToolbar
            sort={sort}
            filtering={filtering}
            dialogs={dialogs}
          />

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
                onDelete={deleteDialog.open}
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
            opacity={tagEditor.mode === "default" ? 100 : 0}
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
