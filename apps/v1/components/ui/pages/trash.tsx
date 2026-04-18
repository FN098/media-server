"use client";

import {
  deleteNodesPermanentlyAction,
  restoreNodesAction,
} from "@/actions/media-actions";
import { DeleteAlertDialog } from "@/components/ui/alert-dialogs/delete-alert-dialog";
import { RestoreAlertDialog } from "@/components/ui/alert-dialogs/restore-alert-dialog";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { ActionsProvider } from "@/providers/actions-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import {
  ArrowDownAz,
  CalendarArrowDown,
  MoreVertical,
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
    pushHistory({ path: listing.path, type: "folder" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollRestored = () => {
    popHistory();
  };

  // ===== フィルタリング =====

  const allNodes = listing.nodes;

  // クエリフィルター
  const { value: queryFilterValue } = useQueryFilter();

  // フィルター結果
  const {
    filtered: filteredNodes,
    mediaOnly,
    filteredCount,
    totalCount,
    isFiltered,
  } = useFilteredNodes({
    allNodes,
    queryFilterValue,
  });

  // 検索パラメータリセット用
  const { hasSearchParams, resetSearchParams } = useSearchParamsControl();

  // ===== ビューア =====

  const {
    normalizedIndex: initialViewerIndex,
    isOpen: isViewerMode,
    open: openViewer,
    close: closeViewer,
  } = useViewerControl(mediaOnly);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    select(media);

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
      openViewer(index);
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

  // ===== 選択機能 =====

  const { isSelectionMode, selected, select, selectAll, resetSelection } =
    useSelectionControl({
      allNodes,
      controlledNodes: filteredNodes,
    });

  // ===== 復元 (Restore) =====

  const [restoreTargets, setRestoreTargets] = useState<MediaNode[]>([]);
  const isRestoreMode = restoreTargets.length > 0;

  // 復元ダイアログを開く（単体）
  const openRestoreDialogSingle = (node: MediaNode) => {
    setRestoreTargets([node]);
  };

  // 復元ダイアログを開く（選択）
  const openRestoreDialogSelected = () => {
    setRestoreTargets(selected);
  };

  // 復元実行
  const handleRestoreDialogConfirm = async () => {
    const paths = restoreTargets.map((n) => n.path);
    const result = await restoreNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを復元しました`);
      resetSelection();
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
  const openDeleteDialogSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 削除ダイアログを開く（選択）
  const openDeleteDialogSelected = () => {
    setDeleteTargets(selected);
  };

  // 削除実行
  const handleDeleteDialogConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesPermanentlyAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを完全に削除しました`);
      resetSelection();
    } else {
      toast.error(`${result.failed}件の削除に失敗しました`);
    }
  };

  // 後始末
  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTargets([]);
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

  // ショートカットの定義
  // Escape: 選択解除
  // Delete: 削除
  // Ctrl + A: 全選択
  // Ctrl + K: 検索
  // P/N: 前/次のフォルダを開く
  useHotkeys("escape", () => resetSelection(), {
    scopes: "trash",
  });
  useHotkeys("delete", () => openDeleteDialogSelected(), {
    scopes: "trash",
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll();
    },
    { scopes: "trash" }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "trash" }
  );
  useHotkeys("p", () => handleOpenPrevFolder("first"), {
    scopes: ["trash", "viewer"],
  });
  useHotkeys("n", () => handleOpenNextFolder("first"), {
    scopes: ["trash", "viewer"],
  });

  // ===== その他 =====

  return (
    <PagingProvider
      totalItems={filteredNodes.length}
      options={{
        defaultPageSize: 48,
        useUrlParams: true,
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
              options={[
                {
                  key: "name",
                  direction: "asc",
                  label: "名前順 (A-Z)",
                  icon: ArrowDownAz,
                },
                {
                  key: "rating",
                  direction: "desc",
                  label: "評価順",
                  icon: Sparkle,
                },
                {
                  key: "favoriteCount",
                  direction: "desc",
                  label: "人気順",
                  icon: Sparkles,
                },
                {
                  key: "mtime",
                  direction: "desc",
                  label: "更新順",
                  icon: CalendarArrowDown,
                },
              ]}
            />

            {/* リセット */}
            <ResetButton
              onReset={resetSearchParams}
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
            <ActionsProvider
              actions={{
                open: handleOpen,
                deletePermanently: openDeleteDialogSingle,
                restore: openRestoreDialogSingle,
              }}
            >
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
              />
            </ActionsProvider>
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                deletePermanently: openDeleteDialogSingle,
                restore: openRestoreDialogSingle,
              }}
            >
              <PagingListView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
              />
            </ActionsProvider>
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
              onPrevFolder={listing.prev ? handleOpenPrevFolder : undefined}
              onNextFolder={listing.next ? handleOpenNextFolder : undefined}
              onDelete={openDeleteDialogSelected}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <SelectionBar
          open={isSelectionMode}
          count={selected.length}
          totalCount={filteredNodes.length}
          onSelectAll={selectAll}
          onClose={resetSelection}
          className="z-40"
          actions={
            <div className="flex gap-1 items-center">
              {/* その他のアクション */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="default"
                    onClick={openRestoreDialogSelected}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    復元
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={openDeleteDialogSelected}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> 完全に削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        {/* 削除警告ダイアログ */}
        <DeleteAlertDialog
          open={isDeleteMode}
          onConfirm={handleDeleteDialogConfirm}
          onOpenChange={handleDeleteDialogOpenChange}
          count={deleteTargets.length}
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
    </PagingProvider>
  );
}
