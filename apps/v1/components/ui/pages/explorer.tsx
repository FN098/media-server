"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import {
  touchMediaTimestampAction,
  updatePreviewAction,
} from "@/actions/media-actions";
import {
  enqueueCreateSingleThumbJobAction,
  enqueueCreateThumbsJobAction,
} from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { ExplorerDialogs } from "@/components/ui/dialogs/explorer-dialogs";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { useExplorerDialogs } from "@/components/ui/pages/hooks/use-explorer-dialogs";
import { useExplorerHotkeys } from "@/components/ui/pages/hooks/use-explorer-hotkeys";
import { useExplorerMenu } from "@/components/ui/pages/hooks/use-explorer-menu";
import { useExplorerSelection } from "@/components/ui/pages/hooks/use-explorer-selection";
import { useExplorerSelectionbar } from "@/components/ui/pages/hooks/use-explorer-selectionbar";
import { FavoriteFilterSelect } from "@/components/ui/selects/favorite-filter-select";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFavoriteFilter } from "@/hooks/use-favorite-filter";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useParentPathname } from "@/hooks/use-parent-pathname";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSort } from "@/hooks/use-sort";
import { useTagEditorControl } from "@/hooks/use-tag-editor-control";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import {
  createFavoriteFilter,
  createMediaOnlyFilter,
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
  withDirectoryControl,
} from "@/lib/filter/factory";
import { IndexLike } from "@/lib/index-like";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import {
  ArrowDownAzIcon,
  CalendarArrowDownIcon,
  ClockIcon,
  FileStackIcon,
  FolderPlus,
  StarsIcon,
  WeightIcon,
} from "lucide-react";
import { useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";

export function Explorer({ listing }: { listing: MediaListing }) {
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

  // 初回マウント時に訪問履歴にプッシュ
  useEffect(() => {
    pushHistory({ path: listing.path, type: "directory" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スクロール完了時に訪問履歴をポップ
  const handleScrollRestored = () => {
    popHistory();
  };

  // フォルダ訪問履歴自動更新
  useEffect(() => {
    if (listing.path) {
      void visitFolderAction(listing.path);
    }
  }, [listing.path]);

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
          icon: ArrowDownAzIcon,
        },
        {
          value: {
            sort: "mtime",
            direction: "desc",
          },
          label: "更新日",
          icon: CalendarArrowDownIcon,
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

  // 種別フィルター
  const { value: mediaTypeFilterValue, apply: applyMediaTypeFilterValue } =
    useMediaTypeFilter();

  // 評価フィルター
  const { value: ratingFilterValue, apply: applyRatingFilterValue } =
    useRatingFilter();

  // タグフィルター
  const { value: tagFilterValue, apply: applyTagFilterValue } = useTagFilter();

  // お気に入りフィルター
  const { value: favoriteFilterValue, apply: applyFavoriteFilterValue } =
    useFavoriteFilter();

  // フィルターパイプライン
  const pipeline = useMemo(
    () => [
      withDirectoryControl(
        createSearchFilter(queryFilterValue),
        "apply-filter"
      ),
      withDirectoryControl(
        createMediaTypeFilter(mediaTypeFilterValue),
        "apply-filter"
      ),
      withDirectoryControl(
        createRatingFilter(ratingFilterValue),
        "apply-filter"
      ),
      withDirectoryControl(createTagFilter(tagFilterValue), "always"),
      withDirectoryControl(createFavoriteFilter(favoriteFilterValue), "always"),
    ],
    [
      queryFilterValue,
      mediaTypeFilterValue,
      ratingFilterValue,
      tagFilterValue,
      favoriteFilterValue,
    ]
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

  // タグをフィルターに追加
  const handleAddTagFilter = (node: MediaNode) => {
    if (!node.tags || node.tags.length === 0) return;
    applyTagFilterValue({
      mode: tagFilterValue.mode,
      tags: [...tagFilterValue.tags, ...node.tags],
    });
  };

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

    selection.replace(media);

    if (lastHistory?.type === "file") {
      replaceHistoryLast(toHistoryItem(media));
    } else {
      pushHistory(toHistoryItem(media));
    }
  };

  // ===== ナビゲーション =====

  const { navigate: openFolder } = useFolderNavigation();

  // インデックス計算
  const { getMediaIndex } = useMediaIndex(mediaOnly);

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path, { resetPage: true });
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

  // 新しいタブで開く
  const handleOpenInNewTab = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path, { newTab: true });
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      openViewer({ at: index, newTab: true });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 前のフォルダを開く
  const handleOpenPrevFolder = (at: IndexLike = "last") => {
    if (listing.prev) {
      openFolder(listing.prev, { at });
    }
  };

  // 次のフォルダを開く
  const handleOpenNextFolder = (at: IndexLike = "first") => {
    if (listing.next) {
      openFolder(listing.next, { at });
    }
  };

  // 一つ上のフォルダを開く
  const { navigateToParent } = useParentPathname();

  // ===== お気に入り =====

  const { updateFavorite, getFavorite, updateMultipleFavorites } =
    useFavoritesContext();
  const [updatingFavorite, startUpdatingFavorite] = useTransition();

  // レーティング更新（単体）
  const handleChangeRatingSingle = ({
    node,
    newRating,
    onSuccess,
  }: {
    node: MediaNode;
    newRating: number | null;
    onSuccess?: () => void;
  }) => {
    if (updatingFavorite) return;
    startUpdatingFavorite(async () => {
      const result = await updateFavorite(node.path, newRating);
      if (result.success) {
        toast.success("レーティングが更新されました。", { duration: 500 });
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  // レーティング更新（選択）
  const handleChangeRatingSelected = ({
    newRating,
    onSuccess,
  }: {
    newRating: number | null;
    onSuccess?: () => void;
  }) => {
    if (updatingFavorite) return;
    startUpdatingFavorite(async () => {
      const paths = selection.nodes.map((n) => n.path);
      const result = await updateMultipleFavorites(paths, {
        rating: newRating,
      });
      if (result.success) {
        toast.success("レーティングが更新されました。", { duration: 500 });
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  // ===== 選択 =====

  const selection = useExplorerSelection({
    allNodes,
    currentNodes: filteredNodes,
  });

  // ===== タグエディタ =====

  const tagEditor = useTagEditorControl({
    isViewerMode,
  });

  // ===== ダイアログ =====

  const dialogs = useExplorerDialogs({
    currentDir: listing.path,
    selectedNodes: selection.nodes,
    clearSelection: selection.reset,
  });

  const {
    isDialogOpen,
    deleteDialog,
    renameDialog,
    extractDialog,
    favoriteDialog,
    previewDialog,
    moveDialog,
    copyDialog,
    createFolderDialog,
  } = dialogs;

  // ===== サムネイル =====

  const [isUpdatingThumb, startUpdatingThumb] = useTransition();

  // サムネイル自動作成
  useEffect(() => {
    if (listing.path) {
      void enqueueCreateThumbsJobAction(listing.path);
    }
  }, [listing.path]);

  const updateThumb = async (node: MediaNode) => {
    // サムネイルを再作成（強制）
    await enqueueCreateSingleThumbJobAction(node.path, { force: true });

    // DBのタイムスタンプを更新（サムネイルのキャッシュを上書き）
    if (!node.isDirectory) {
      const touched = await touchMediaTimestampAction(node.path);
      if (touched.error) toast.error(touched.error);
    }

    // プレビュー設定を解除
    const updated = await updatePreviewAction(node.path, null);
    if (updated.error) toast.error(updated.error);

    // ブラウザキャッシュ更新のため、一時的にタイムスタンプを変更
    node.mtime = new Date();
  };

  // サムネイル更新（単体）
  const handleUpdateThumbSingle = (node: MediaNode) => {
    if (isUpdatingThumb) return;
    startUpdatingThumb(async () => {
      await updateThumb(node);
    });
  };

  // サムネイル更新（選択）
  const handleUpdateThumbSelected = () => {
    if (isUpdatingThumb) return;
    startUpdatingThumb(async () => {
      for (const node of selection.nodes) {
        await updateThumb(node);
      }
    });
  };

  // ===== モバイル =====

  const isMobile = useIsMobile();

  // ===== フルスクリーン =====

  const { isSupported: isFullscreenSupported, toggleFullscreen } =
    useFullscreen();

  const handleToggleFullscreen = () => void toggleFullscreen();

  // ===== ショートカット =====

  useExplorerHotkeys({
    enabled: true,
    isDialogMode: isDialogOpen,
    isTagEditorMode: tagEditor.isOpen,
    isViewerMode: isViewerMode,
    onResetSelection: selection.reset,
    onGoBack: navigateToParent,
    onDelete: deleteDialog.openSelected,
    onEditTags: tagEditor.open,
    onToggleFullscreen: handleToggleFullscreen,
    onSelectAll: selection.selectAll,
    onFocusSearch: focusSearch,
    onRename: () => renameDialog.setTarget(selection.nodes[0]),
    onOpenPrevFolder: () => handleOpenPrevFolder("first"),
    onOpenNextFolder: () => handleOpenNextFolder("first"),
    onResetFilter: clearSearchParams,
  });

  // ===== メニュー =====

  const menu = useExplorerMenu({
    hasSelection: selection.hasSelection,
    selectedCount: selection.count,
    isViewerMode,
    isFullscreenSupported,
    getFavorite,
    onOpenInNewTab: handleOpenInNewTab,
    onExtract: extractDialog.open,
    onExtractSelected: extractDialog.openSelected,
    onChangeRating: handleChangeRatingSingle,
    onChangeRatingSelected: handleChangeRatingSelected,
    onToggleFullscreen: handleToggleFullscreen,
    onRename: renameDialog.open,
    onMove: moveDialog.open,
    onMoveSelected: moveDialog.openSelected,
    onCopy: copyDialog.open,
    onCopySelected: copyDialog.openSelected,
    onEditTags: tagEditor.open,
    onAddTagsToFilter: handleAddTagFilter,
    onApplyAsPreview: previewDialog.open,
    onUpdateThumb: handleUpdateThumbSingle,
    onUpdateThumbSelected: handleUpdateThumbSelected,
    onDelete: deleteDialog.open,
    onDeleteSelected: deleteDialog.openSelected,
  });

  const selectionbar = useExplorerSelectionbar({
    hasSelection: selection.hasSelection,
    onChangeRating: handleChangeRatingSingle,
    onChangeRatingSelected: handleChangeRatingSelected,
    onMoveSelected: moveDialog.openSelected,
    onCopySelected: copyDialog.openSelected,
    onEditTagsSelected: tagEditor.open,
    onUpdateThumbSelected: handleUpdateThumbSelected,
    onDeleteSelected: deleteDialog.openSelected,
    onAddFavoriteSelected: () => favoriteDialog.openSelected({ mode: "add" }),
    onRemoveFavoriteSelected: () =>
      favoriteDialog.openSelected({ mode: "remove" }),
  });

  return (
    <PagingProvider totalItems={filteredNodes.length}>
      <MenuItemsProvider items={menu.items}>
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

              {/* お気に入りフィルター */}
              <FavoriteFilterSelect
                value={favoriteFilterValue}
                onChange={applyFavoriteFilterValue}
              />

              {/* 種別フィルター */}
              <MediaTypeFilterMultiSelect
                value={mediaTypeFilterValue}
                onChange={applyMediaTypeFilterValue}
                displayTypes={["image", "video", "audio"]}
              />

              {/* 評価フィルター */}
              <RatingFilterDialog
                value={ratingFilterValue}
                onChange={applyRatingFilterValue}
              />

              {/* タグフィルター */}
              <TagFilterDialog
                value={tagFilterValue}
                onChange={applyTagFilterValue}
                relatedNodes={mediaOnly}
                autoFocusInput={!isMobile}
              />

              {/* 新規フォルダ作成 */}
              <Button variant="outline" onClick={createFolderDialog.open}>
                <FolderPlus className="h-4 w-4" />
                新規フォルダ
              </Button>

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
          {viewMode === "grid" && !isViewerMode && (
            <div className="flex-1">
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
                onThumbError={handleUpdateThumbSingle}
                onOpen={handleOpen}
                focusOnPageChange
              />
            </div>
          )}

          {/* リストビュー */}
          {viewMode === "list" && !isViewerMode && (
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
                menuItems={menu.items}
                onIndexChange={handleViewerIndexChange}
                onClose={closeViewer}
                onOpenPrev={handleOpenPrevFolder}
                onOpenNext={handleOpenNextFolder}
                onDelete={deleteDialog.open}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
          <SelectionBar
            open={selection.hasSelection && !tagEditor.isOpen}
            count={selection.count}
            totalCount={filteredNodes.length}
            onSelectAll={selection.selectAll}
            onClose={selection.reset}
            className="z-40" // DropdownMenu より小さくする
            context={selection}
            menuItems={selectionbar.menu.items}
            inlineMenuItems={selectionbar.menu.inlineItems}
          />

          {/* タグエディター */}
          <TagEditSheet
            open={tagEditor.isOpen}
            targetNodes={selection.nodes}
            onClose={tagEditor.close}
            mode={tagEditor.mode}
            opacity={tagEditor.mode === "default" ? 100 : 0}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />

          {/* ダイアログ */}
          <ExplorerDialogs {...dialogs} />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
