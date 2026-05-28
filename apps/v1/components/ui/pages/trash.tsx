"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TrashDialogs } from "@/components/ui/pages/trash/components/trash-dialogs";
import { TrashToolbar } from "@/components/ui/pages/trash/components/trash-toolbar";
import { useTrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { useTrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { useTrashHotkeys } from "@/components/ui/pages/trash/hooks/use-trash-hotkeys";
import { useTrashMenu } from "@/components/ui/pages/trash/hooks/use-trash-menu";
import { useTrashNavigation } from "@/components/ui/pages/trash/hooks/use-trash-navigation";
import { useTrashSelection } from "@/components/ui/pages/trash/hooks/use-trash-selection";
import { useTrashSelectionbar } from "@/components/ui/pages/trash/hooks/use-trash-selectionbar";
import { useTrashThumbs } from "@/components/ui/pages/trash/hooks/use-trash-thumbs";
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

export function Trash({ listing }: { listing: MediaListing }) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();
  const filtering = useTrashFiltering({ listing });
  const selection = useTrashSelection({ listing, filtering });

  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation({});
  const history = useHistoryContext();
  const navigation = useTrashNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
  });

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

  const dialogs = useTrashDialogs();

  const thumbs = useTrashThumbs({
    listing,
  });

  const fullscreen = useFullscreen();

  useTrashHotkeys({
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

  const menu = useTrashMenu({
    selection,
    dialogs,
    navigation,
    viewer,
    fullscreen,
  });

  const selectionbar = useTrashSelectionbar({
    selection,
    dialogs,
    tagEditor,
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
            <TrashToolbar
              listing={listing}
              filtering={filtering}
              dialogs={dialogs}
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
            opacity={tagEditor.mode === "default" ? 100 : 0}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation
            prevPath={listing.prev}
            nextPath={listing.next}
            mode="trash"
          />

          {/* ダイアログ */}
          <TrashDialogs dialogs={dialogs} />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
