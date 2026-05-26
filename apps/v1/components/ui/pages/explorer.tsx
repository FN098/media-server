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
import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { ExtractDialog } from "@/components/ui/dialogs/extract-dialog";
import {
  FavoriteDialog,
  FavoriteDialogMode,
} from "@/components/ui/dialogs/favorite-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { useCopyDialog } from "@/components/ui/pages/hooks/dialogs/use-copy-dialog";
import { useCreateFolderDialog } from "@/components/ui/pages/hooks/dialogs/use-create-folder-dialog";
import { useDeleteDialog } from "@/components/ui/pages/hooks/dialogs/use-delete-dialog";
import { useExtractDialog } from "@/components/ui/pages/hooks/dialogs/use-extract-dialog";
import { useMoveDialog } from "@/components/ui/pages/hooks/dialogs/use-move-dialog";
import { usePreviewDialog } from "@/components/ui/pages/hooks/dialogs/use-preview-dialog";
import { useRenameDialog } from "@/components/ui/pages/hooks/dialogs/use-rename-dialog";
import { useExplorerHotkeys } from "@/components/ui/pages/hooks/use-explorer-hotkeys";
import { useExplorerMenuItems } from "@/components/ui/pages/hooks/use-explorer-menu-items";
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
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { useSort } from "@/hooks/use-sort";
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
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
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
import { useEffect, useMemo, useState, useTransition } from "react";
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

    handleSelect(media);

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

  // お気に入りダイアログ制御
  const [favoriteTargets, setFavoriteDialogTargets] = useState<MediaNode[]>([]);
  const [favoriteDialogMode, setFavoriteDialogMode] =
    useState<FavoriteDialogMode>("add");
  const isFavoriteDialogOpen = favoriteTargets.length > 0;

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
      const paths = selectedNodes.map((n) => n.path);
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

  // お気に入り登録ダイアログを開く
  const handleOpenFavoriteAddDialog = () => {
    setFavoriteDialogMode("add");
    setFavoriteDialogTargets(selectedNodes);
  };

  // お気に入り解除ダイアログを開く
  const handleOpenFavoriteRemoveDialog = () => {
    setFavoriteDialogMode("remove");
    setFavoriteDialogTargets(selectedNodes);
  };

  // 後始末
  const handleFavoriteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setFavoriteDialogTargets([]);
    }
  };

  // ===== 選択 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectedCount,
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

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

  // タグエディタを開く
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };

  // タグエディタを閉じる
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };

  // タグエディタを表示/非表示
  const handleToggleTagEditMode = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // ===== ダイアログ =====

  // リネーム
  const {
    renameTarget,
    setRenameTarget,
    isRenameMode,
    handleOpenRenameDialog,
    handleRenameDialogOpenChange,
  } = useRenameDialog({});

  // 解凍
  const {
    extractTargets,
    isExtractMode,
    handleOpenExtractDialogSingle,
    handleOpenExtractDialogSelected,
    handleExtractDialogOpenChange,
  } = useExtractDialog({
    selectedNodes,
    onClose: handleResetSelection,
  });

  // フォルダ作成
  const {
    isCreateFolderMode,
    handleOpenCreateFolderDialog,
    handleCreateFolderDialogOpenChange,
  } = useCreateFolderDialog({
    targetDirPath: listing.path,
  });

  // 移動
  const {
    moveTargets,
    isMoveMode,
    initialMoveDialogDirPath,
    handleOpenMoveDialogSingle,
    handleOpenMoveDialogSelected,
    handleMoveDialogOpenChange,
  } = useMoveDialog({
    selectedNodes,
    onClose: handleResetSelection,
  });

  // コピー
  const {
    copyTargets,
    isCopyMode,
    initialCopyDialogDirPath,
    handleOpenCopyDialogSingle,
    handleOpenCopyDialogSelected,
    handleCopyDialogOpenChange,
  } = useCopyDialog({
    selectedNodes,
    onClose: handleResetSelection,
  });

  // 削除
  const {
    deleteTargets,
    isDeleteMode,
    handleOpenDeleteDialogSingle,
    handleOpenDeleteDialogSelected,
    handleDeleteDialogOpenChange,
  } = useDeleteDialog({
    selectedNodes,
    onClose: handleResetSelection,
  });

  // プレビュー設定
  const {
    previewPath,
    isFolderPreviewMode,
    handleOpenApplyPreviewDialog,
    handleApplyPreviewDialogOpenChange,
  } = usePreviewDialog({});

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
      for (const node of selectedNodes) {
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
    isDialogMode: isRenameMode || isMoveMode || isDeleteMode,
    isTagEditorMode: isTagEditMode,
    isViewerMode: isViewerMode,
    onResetSelection: handleResetSelection,
    onGoBack: navigateToParent,
    onDelete: handleOpenDeleteDialogSelected,
    onEditTags: handleToggleTagEditMode,
    onToggleFullscreen: handleToggleFullscreen,
    onSelectAll: handleSelectAll,
    onFocusSearch: focusSearch,
    onRename: () => setRenameTarget(selectedNodes[0]),
    onOpenPrevFolder: () => handleOpenPrevFolder("first"),
    onOpenNextFolder: () => handleOpenNextFolder("first"),
    onResetFilter: clearSearchParams,
  });

  // ===== メニュー =====

  const { menuItems, selectionBarInlineMenuItems, selectionBarMenuItems } =
    useExplorerMenuItems({
      hasSelection,
      selectedCount,
      isViewerMode,
      isFullscreenSupported,
      getFavorite,
      onOpenInNewTab: handleOpenInNewTab,
      onExtract: handleOpenExtractDialogSingle,
      onExtractSelected: handleOpenExtractDialogSelected,
      onChangeRating: handleChangeRatingSingle,
      onChangeRatingSelected: handleChangeRatingSelected,
      onToggleFullscreen: handleToggleFullscreen,
      onRename: handleOpenRenameDialog,
      onMove: handleOpenMoveDialogSingle,
      onMoveSelected: handleOpenMoveDialogSelected,
      onCopy: handleOpenCopyDialogSingle,
      onCopySelected: handleOpenCopyDialogSelected,
      onEditTags: handleOpenTagEditor,
      onEditTagsSelected: handleOpenTagEditor,
      onAddTagsToFilter: handleAddTagFilter,
      onApplyAsPreview: handleOpenApplyPreviewDialog,
      onUpdateThumb: handleUpdateThumbSingle,
      onUpdateThumbSelected: handleUpdateThumbSelected,
      onDelete: handleOpenDeleteDialogSingle,
      onDeleteSelected: handleOpenDeleteDialogSelected,
      onAddFavoriteSelected: handleOpenFavoriteAddDialog,
      onRemoveFavoriteSelected: handleOpenFavoriteRemoveDialog,
    });

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
              <Button variant="outline" onClick={handleOpenCreateFolderDialog}>
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
                menuItems={menuItems}
                onIndexChange={handleViewerIndexChange}
                onClose={closeViewer}
                onOpenPrev={handleOpenPrevFolder}
                onOpenNext={handleOpenNextFolder}
                onDelete={handleOpenDeleteDialogSingle}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
          <SelectionBar
            open={isSelectionMode && !isTagEditMode}
            count={selectedNodes.length}
            totalCount={filteredNodes.length}
            onSelectAll={handleSelectAll}
            onClose={handleResetSelection}
            className="z-40" // DropdownMenu より小さくする
            context={{ nodes: selectedNodes }}
            menuItems={selectionBarMenuItems}
            inlineMenuItems={selectionBarInlineMenuItems}
          />

          {/* タグエディター */}
          <TagEditSheet
            open={isTagEditMode}
            targetNodes={selectedNodes}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
            opacity={tagEditMode === "default" ? 100 : 0}
          />

          {/* 解凍ダイアログ */}
          <ExtractDialog
            open={isExtractMode}
            onOpenChange={handleExtractDialogOpenChange}
            targetNodes={extractTargets}
          />

          {/* リネームダイアログ */}
          <RenameDialog
            open={isRenameMode}
            onOpenChange={handleRenameDialogOpenChange}
            sourcePath={renameTarget?.path ?? ""}
            currentName={renameTarget?.name ?? ""}
            isDirectory={renameTarget?.isDirectory}
          />

          {/* フォルダ作成ダイアログ */}
          <CreateFolderDialog
            key={`create-folder-${isCreateFolderMode}`}
            open={isCreateFolderMode}
            onOpenChange={handleCreateFolderDialogOpenChange}
            parentPath={listing.path}
          />

          {/* 移動ダイアログ */}
          <MoveDialog
            open={isMoveMode}
            onOpenChange={handleMoveDialogOpenChange}
            sourceNodes={moveTargets}
            initialDirPath={initialMoveDialogDirPath}
          />

          {/* コピーダイアログ */}
          <CopyDialog
            open={isCopyMode}
            onOpenChange={handleCopyDialogOpenChange}
            sourceNodes={copyTargets}
            initialDirPath={initialCopyDialogDirPath}
          />

          {/* 削除ダイアログ */}
          <DeleteDialog
            open={isDeleteMode}
            onOpenChange={handleDeleteDialogOpenChange}
            targetNodes={deleteTargets}
          />

          {/* プレビュー設定ダイアログ */}
          <ApplyPreviewDialog
            open={isFolderPreviewMode}
            onOpenChange={handleApplyPreviewDialogOpenChange}
            previewPath={previewPath}
          />

          {/* お気に入りダイアログ */}
          <FavoriteDialog
            open={isFavoriteDialogOpen}
            onOpenChange={handleFavoriteDialogOpenChange}
            targetNodes={favoriteTargets}
            mode={favoriteDialogMode}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
