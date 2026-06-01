"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ExplorerDialogs } from "@/components/ui/dialogs/explorer-dialogs";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { ExplorerToolbar } from "@/components/ui/toolbars/explorer-toolbar";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { useExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { useExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { useExplorerHotkeys } from "@/hooks/explorer/use-explorer-hotkeys";
import { useExplorerMenu } from "@/hooks/explorer/use-explorer-menu";
import { useExplorerNavigation } from "@/hooks/explorer/use-explorer-navigation";
import { useExplorerSelectionbar } from "@/hooks/explorer/use-explorer-selectionbar";
import { useExplorerThumbs } from "@/hooks/explorer/use-explorer-thumbs";
import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigations/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useTagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { useViewMode } from "@/hooks/view/use-view-mode";
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
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();
  const filtering = useExplorerFiltering({ listing });
  const selection = useMediaNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const dialogs = useExplorerDialogs({ filtering });
  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation({});
  const history = useHistoryContext();
  const favorites = useExplorerFavorites();

  const navigation = useExplorerNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
    dialogs,
  });

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

  const thumbs = useExplorerThumbs({ listing });
  const fullscreen = useFullscreen();

  useExplorerHotkeys({
    enabled: true,
    listing,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    searchFocus,
  });

  const menu = useExplorerMenu({
    listing,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    favorites,
    thumbs,
  });

  const selectionbar = useExplorerSelectionbar({
    listing,
    selection,
    dialogs,
    tagEditor,
    favorites,
    thumbs,
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
