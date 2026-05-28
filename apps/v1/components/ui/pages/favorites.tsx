"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoritesDialogs } from "@/components/ui/pages/favorites/components/favorites-dialogs";
import { FavoritesToolbar } from "@/components/ui/pages/favorites/components/favorites-toolbar";
import { useFavoritesDialogs } from "@/components/ui/pages/favorites/hooks/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/components/ui/pages/favorites/hooks/use-favorites-favorites";
import { useFavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/components/ui/pages/favorites/hooks/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/components/ui/pages/favorites/hooks/use-favorites-menu";
import { useFavoritesNavigation } from "@/components/ui/pages/favorites/hooks/use-favorites-navigation";
import { useFavoritesSelection } from "@/components/ui/pages/favorites/hooks/use-favorites-selection";
import { useFavoritesSelectionbar } from "@/components/ui/pages/favorites/hooks/use-favorites-selectionbar";
import { useFavoritesSort } from "@/components/ui/pages/favorites/hooks/use-favorites-sort";
import { useFavoritesThumbs } from "@/components/ui/pages/favorites/hooks/use-favorites-thumbs";
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

export function Favorites({ listing }: { listing: MediaListing }) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();
  const sort = useFavoritesSort();
  const filtering = useFavoritesFiltering({ listing });
  const selection = useFavoritesSelection({ listing, filtering });

  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation({});
  const history = useHistoryContext();
  const navigation = useFavoritesNavigation({
    filtering,
    selection,
    viewer,
    history,
    folder,
  });

  const favorites = useFavoritesFavorites();

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

  const dialogs = useFavoritesDialogs();
  const thumbs = useFavoritesThumbs();
  const fullscreen = useFullscreen();

  useFavoritesHotkeys({
    enabled: true,
    filtering,
    selection,
    dialogs,
    tagEditor,
    viewer,
    fullscreen,
    searchFocus,
  });

  const menu = useFavoritesMenu({
    filtering,
    selection,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    favorites,
  });

  const selectionbar = useFavoritesSelectionbar({
    selection,
    tagEditor,
    favorites,
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
            <FavoritesToolbar sort={sort} filtering={filtering} />
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

          {/* ダイアログ */}
          <FavoritesDialogs dialogs={dialogs} />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
