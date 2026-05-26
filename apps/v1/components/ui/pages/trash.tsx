"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { RestoreDialog } from "@/components/ui/dialogs/restore-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useParentPathname } from "@/hooks/use-parent-pathname";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { useSort } from "@/hooks/use-sort";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import {
  createMediaOnlyFilter,
  createSearchFilter,
  withDirectoryControl,
} from "@/lib/filter/factory";
import { IndexLike } from "@/lib/index-like";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import {
  MenuItemDef,
  MultipleNodesContext,
  NodeContext,
} from "@/lib/menu-items/types";
import { useHistoryContext } from "@/providers/history-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { cn } from "@/shadcn/lib/utils";
import {
  ArrowDownAz,
  CalendarArrowDown,
  ClockIcon,
  FileStackIcon,
  FullscreenIcon,
  RotateCcwIcon,
  StarsIcon,
  Trash2Icon,
  WeightIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { toast } from "sonner";

export function Trash({ listing }: { listing: MediaListing }) {
  // ===== 検索 =====

  const { trigger: focusSearch } = useSearchFocusContext();

  // ===== ビューモード =====

  const { value: viewMode } = useViewMode();

  // ===== 訪問履歴 =====

  const {
    last: lastHistory,
    pushHistory,
    toHistoryItem,
    popHistory,
    replaceHistoryLast,
  } = useHistoryContext();

  useEffect(() => {
    pushHistory({ path: listing.path, type: "directory" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollRestored = () => {
    popHistory();
  };

  // ===== 並び替え =====

  // NOTE: 並び替え処理はサーバーサイドで実施
  const { value: sortValue, apply: applySortValue } = useSort();

  const sortOptions = useMemo(
    () =>
      [
        {
          value: {
            sort: "name",
            direction: "asc",
          },
          label: "名前",
          icon: ArrowDownAz,
        },
        {
          value: {
            sort: "mtime",
            direction: "desc",
          },
          label: "更新日",
          icon: CalendarArrowDown,
        },
        {
          value: {
            sort: "size",
            direction: "desc",
          },
          label: "サイズ",
          icon: WeightIcon,
        },
        {
          value: {
            sort: "fileCount",
            direction: "desc",
          },
          label: "ファイル数",
          icon: FileStackIcon,
        },
        {
          value: {
            sort: "lastViewed",
            direction: "desc",
          },
          label: "訪問日",
          icon: ClockIcon,
        },
        {
          value: {
            sort: "rating",
            direction: "desc",
          },
          label: "評価",
          icon: StarsIcon,
        },
      ] as const,
    []
  );

  // ===== フィルタリング =====

  const allNodes = listing.nodes;

  // クエリフィルター
  const { value: queryFilterValue } = useQueryFilter();

  // フィルターパイプライン
  const pipeline = useMemo(
    () => [
      withDirectoryControl(
        createSearchFilter(queryFilterValue),
        "apply-filter"
      ),
    ],
    [queryFilterValue]
  );

  // フィルター結果
  const {
    filtered: filteredNodes,
    filteredCount,
    totalCount,
    isFiltered,
  } = useFilteredNodes(allNodes, pipeline);

  // 「メディアのみ」のフィルターパイプライン
  const mediaOnlyPipeline = useMemo(() => [createMediaOnlyFilter()], []);

  // 「メディアのみ」のリスト
  const { filtered: mediaOnly } = useFilteredNodes(
    filteredNodes,
    mediaOnlyPipeline
  );

  // 検索パラメータリセット用
  const { hasResettableSearchParams, clearSearchParams } =
    useSearchParamsControl({ keep: ["viewMode"] });

  // ===== ビューア =====

  const {
    index: initialViewerIndex,
    isOpen: isViewerMode,
    open: openViewer,
    close: closeViewer,
  } = useViewerControl(mediaOnly);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    handleSelect(media);

    if (lastHistory?.type === "file") {
      replaceHistoryLast(toHistoryItem(media));
    } else {
      pushHistory(toHistoryItem(media));
    }
  };

  // ===== ナビゲーション =====

  const { navigate: openFolder } = useFolderNavigation();
  const { getMediaIndex } = useMediaIndex(mediaOnly);

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path, { deleted: true, resetPage: true });
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      openViewer({ at: index });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 前のフォルダを開く
  const handleOpenPrevFolder = (at: IndexLike = "last") => {
    if (listing.prev) {
      openFolder(listing.prev, { at, deleted: true });
    }
  };

  // 次のフォルダを開く
  const handleOpenNextFolder = (at: IndexLike = "first") => {
    if (listing.next) {
      openFolder(listing.next, { at, deleted: true });
    }
  };

  // 一つ上のフォルダを開く
  const { navigateToParent } = useParentPathname();

  // ===== 選択 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
    selectPaths,
    clearSelection,
    hasSelection,
  } = usePathSelectionContext();

  const { selectedNodes } = useSelectedNodes(allNodes, selectedPaths);

  // 選択
  const handleSelect = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  // 全選択
  const handleSelectAll = () => {
    selectPaths(filteredNodes.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const handleResetSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  // ===== 復元 =====

  const [restoreTargets, setRestoreTargets] = useState<MediaNode[]>([]);
  const isRestoreMode = restoreTargets.length > 0;

  // 復元ダイアログを開く（単体）
  const handleOpenRestoreDialogSingle = (node: MediaNode) => {
    setRestoreTargets([node]);
  };

  // 復元ダイアログを開く（選択）
  const handleOpenRestoreDialogSelected = () => {
    setRestoreTargets(selectedNodes);
  };

  // 後始末
  const handleRestoreDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRestoreTargets([]);
      handleResetSelection();
    }
  };

  // ===== 削除 =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 削除ダイアログを開く（単体）
  const handleOpenDeleteDialogSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 削除ダイアログを開く（選択）
  const handleOpenDeleteDialogSelected = () => {
    setDeleteTargets(selectedNodes);
  };

  // 後始末
  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTargets([]);
      handleResetSelection();
    }
  };

  // ===== フルスクリーン =====

  const fullscreen = useFullscreen();

  // ===== ショートカット =====

  // スコープを切り替えるフック
  const { enableScope, disableScope } = useHotkeysContext();

  // ショートカットを利用可能なスコープ
  const allScopes = useMemo(
    () => ["trash", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  // 現在のスコープ
  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isDeleteMode || isRestoreMode) return "dialog";
    else if (isViewerMode) return "viewer";
    else return "trash";
  }, [isDeleteMode, isRestoreMode, isViewerMode]);

  // デバッグ用
  useEffect(() => console.debug({ activeScope }), [activeScope]);

  // スコープの排他的制御
  useEffect(() => {
    // 該当スコープを有効にし、それ以外を無効にする
    allScopes.forEach((s) => {
      if (s === activeScope) {
        enableScope(s);
      } else {
        disableScope(s);
      }
    });
  }, [activeScope, allScopes, disableScope, enableScope]);

  // Escape: 選択解除
  useHotkeys("escape", () => handleResetSelection(), {
    scopes: "trash",
  });

  // Backspace: 一つ上のフォルダを開く
  useHotkeys("backspace", () => navigateToParent(), {
    scopes: ["explorer"],
  });

  // Delete: 削除
  useHotkeys("delete", () => handleOpenDeleteDialogSelected(), {
    scopes: "trash",
  });

  // Ctrl + A: 全選択
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      handleSelectAll();
    },
    { scopes: "trash" }
  );

  // Ctrl + K: 検索
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "trash" }
  );

  // P/N: 前/次のフォルダを開く
  useHotkeys("p", () => handleOpenPrevFolder(), {
    scopes: ["trash", "viewer"],
  });

  useHotkeys("n", () => handleOpenNextFolder(), {
    scopes: ["trash", "viewer"],
  });

  // R: フィルタリセット
  useHotkeys("r", () => clearSearchParams(), {
    scopes: ["trash"],
  });

  // ===== メニュー =====

  const menuItems: MenuItemDef<NodeContext>[] = [
    {
      key: "toggleFullscreen",
      type: "action",
      icon: FullscreenIcon,
      label: "全画面",
      onClick: fullscreen.toggleFullscreen,
      hidden: () => !isViewerMode || !fullscreen.isSupported,
    },
    {
      key: "restore",
      type: "action",
      icon: RotateCcwIcon,
      label: "復元",
      onClick: ({ node }) =>
        hasSelection
          ? handleOpenRestoreDialogSelected()
          : handleOpenRestoreDialogSingle(node),
    },
    {
      key: "delete",
      type: "action",
      icon: Trash2Icon,
      variant: "destructive",
      label: "削除",
      onClick: ({ node }) =>
        hasSelection
          ? handleOpenDeleteDialogSelected()
          : handleOpenDeleteDialogSingle(node),
    },
  ];

  const selectionBarMenuItems: MenuItemDef<MultipleNodesContext>[] = [
    {
      key: "restore",
      type: "action",
      icon: RotateCcwIcon,
      label: "復元",
      onClick: handleOpenRestoreDialogSelected,
    },
    {
      key: "delete-permamently",
      type: "action",
      icon: Trash2Icon,
      label: "完全に削除",
      className: "text-destructive",
      onClick: handleOpenDeleteDialogSelected,
    },
  ];

  return (
    <PagingProvider totalItems={filteredNodes.length}>
      <MenuItemsProvider items={menuItems}>
        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
          )}
          tabIndex={-1}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
            {/* 操作メニュー */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
              {/* 並び替え */}
              <SortSelect
                value={sortValue}
                onChange={applySortValue}
                options={sortOptions}
              />

              {/* リセット */}
              <ResetButton
                onClick={clearSearchParams}
                isVisible={hasResettableSearchParams}
              />
            </div>

            {/* 件数 */}
            <FilterResultText
              totalCount={totalCount}
              filteredCount={filteredCount}
              isFiltered={isFiltered}
              className="ml-auto min-w-[120px] text-right"
            />
          </div>

          {/* グリッドビュー */}
          {viewMode === "grid" && (
            <div className="flex-1">
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
                onOpen={handleOpen}
                focusOnPageChange
              />
            </div>
          )}

          {/* リストビュー */}
          {viewMode === "list" && (
            <div className="flex-1">
              <PagingListView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
                onOpen={handleOpen}
                focusOnPageChange
              />
            </div>
          )}

          {/* ビューワ */}
          {isViewerMode && (
            <ScrollLockProvider>
              <MediaViewer
                allNodes={mediaOnly}
                initialIndex={initialViewerIndex}
                menuItems={menuItems}
                onIndexChange={handleViewerIndexChange}
                onClose={closeViewer}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
          <SelectionBar
            open={isSelectionMode}
            count={selectedNodes.length}
            totalCount={filteredNodes.length}
            onSelectAll={handleSelectAll}
            onClose={handleResetSelection}
            className="z-40"
            context={{ nodes: selectedNodes }}
            menuItems={selectionBarMenuItems}
          />

          {/* 削除ダイアログ */}
          <DeleteDialog
            open={isDeleteMode}
            onOpenChange={handleDeleteDialogOpenChange}
            targetNodes={deleteTargets}
            permanent
          />

          {/* 復元ダイアログ */}
          <RestoreDialog
            open={isRestoreMode}
            onOpenChange={handleRestoreDialogOpenChange}
            targetNodes={restoreTargets}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation
            prevPath={listing.prev}
            nextPath={listing.next}
            isDeleted
          />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
