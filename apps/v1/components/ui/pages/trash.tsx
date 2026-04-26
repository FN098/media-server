"use client";

import { restoreNodesAction } from "@/actions/media-actions";
import { RestoreAlertDialog } from "@/components/ui/alert-dialogs/restore-alert-dialog";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
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
import { useHistoryContext } from "@/providers/history-provider";
import { MediaActionsProvider } from "@/providers/media-actions-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { cn } from "@/shadcn/lib/utils";
import {
  ArrowDownAz,
  CalendarArrowDown,
  RotateCcw,
  Sparkle,
  Sparkles,
  Trash2,
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
  const { hasSearchParams, clearSearchParams } = useSearchParamsControl();

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
      openFolder(node.path, { deleted: true });
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

  // 復元実行
  const handleRestoreDialogConfirm = async () => {
    const paths = restoreTargets.map((n) => n.path);
    const result = await restoreNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを復元しました`);
      handleResetSelection();
    } else {
      toast.error(`${result.failed}件の復元に失敗しました`);
    }
  };

  // 後始末
  const handleRestoreDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRestoreTargets([]);
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
  const openDeleteDialogSelected = () => {
    setDeleteTargets(selectedNodes);
  };

  // 後始末
  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTargets([]);
      handleResetSelection();
    }
  };

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
    if (isViewerMode) return "viewer";
    return "trash";
  }, [isViewerMode]);

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
  useHotkeys("delete", () => openDeleteDialogSelected(), {
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

  // ===== その他 =====

  return (
    <PagingProvider totalItems={filteredNodes.length} defaultPageSize={48}>
      <MediaActionsProvider
        actions={{
          onOpen: handleOpen,
          onOpenNextFolder: () => handleOpenNextFolder(),
          onOpenPrevFolder: () => handleOpenPrevFolder(),
          onDeletePermanently: handleOpenDeleteDialogSingle,
          onRestore: handleOpenRestoreDialogSingle,
        }}
      >
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
                options={[
                  {
                    value: {
                      sort: "name",
                      direction: "asc",
                    },
                    label: "名前順 (A-Z)",
                    icon: ArrowDownAz,
                  },
                  {
                    value: {
                      sort: "rating",
                      direction: "desc",
                    },
                    label: "評価順",
                    icon: Sparkle,
                  },
                  {
                    value: {
                      sort: "favoriteCount",
                      direction: "desc",
                    },
                    label: "人気順",
                    icon: Sparkles,
                  },
                  {
                    value: {
                      sort: "mtime",
                      direction: "desc",
                    },
                    label: "更新順",
                    icon: CalendarArrowDown,
                  },
                ]}
              />

              {/* リセット */}
              <ResetButton
                onClick={clearSearchParams}
                isVisible={hasSearchParams}
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
                onIndexChange={handleViewerIndexChange}
                onClose={closeViewer}
                menuConfig={{
                  enabled: {
                    pinHeader: true,
                    toggleFavorite: false,
                    changeRating: false,
                    delete: false,
                    deletePermanently: true,
                    editTags: false,
                    openNextFolder: true,
                    openParentFolder: false,
                    openPrevFolder: true,
                    restore: true,
                    toggleFullscreen: true,
                  },
                }}
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
            menuActions={[
              {
                label: "復元",
                onClick: handleOpenRestoreDialogSelected,
                icon: RotateCcw,
              },
              {
                label: "完全に削除",
                onClick: openDeleteDialogSelected,
                icon: Trash2,
                className: "text-destructive",
              },
            ]}
          />

          {/* 削除ダイアログ */}
          <DeleteDialog
            open={isDeleteMode}
            onOpenChange={handleDeleteDialogOpenChange}
            targetNodes={deleteTargets}
            permanent
          />

          {/* 復元警告ダイアログ */}
          <RestoreAlertDialog
            open={isRestoreMode}
            onConfirm={handleRestoreDialogConfirm}
            onOpenChange={handleRestoreDialogOpenChange}
            count={restoreTargets.length}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation
            prevPath={listing.prev}
            nextPath={listing.next}
            isDeleted
          />
        </div>
      </MediaActionsProvider>
    </PagingProvider>
  );
}
