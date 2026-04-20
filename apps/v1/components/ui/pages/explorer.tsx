"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import {
  deleteNodesAction,
  touchMediaTimestampAction,
  updatePreviewAction,
} from "@/actions/media-actions";
import {
  enqueueCreateSingleThumbJobAction,
  enqueueCreateThumbsJobAction,
} from "@/actions/thumb-actions";
import { DeleteAlertDialog } from "@/components/ui/alert-dialogs/delete-alert-dialog";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
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
import { useMediaIndex } from "@/hooks/use-media-index";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useSort } from "@/hooks/use-sort";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import {
  createFavoriteFilter,
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/filter/factory";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { MediaActionsProvider } from "@/providers/media-actions-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
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
  Copy,
  FolderInput,
  FolderPlus,
  MoreVertical,
  Sparkle,
  Sparkles,
  TagIcon,
  Trash2,
} from "lucide-react";
import { dirname } from "path";
import { useEffect, useMemo, useState } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
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

  // フィルター結果
  const {
    filtered: filteredNodes,
    mediaOnly,
    filteredCount,
    totalCount,
    isFiltered,
  } = useFilteredNodes(allNodes, [
    createSearchFilter(queryFilterValue),
    createMediaTypeFilter(mediaTypeFilterValue),
    createRatingFilter(ratingFilterValue),
    createTagFilter(tagFilterValue),
    createFavoriteFilter(favoriteFilterValue),
  ]);

  // タグをフィルターに追加
  const handleAddTagFilter = (node: MediaNode) => {
    if (!node.tags || node.tags.length === 0) return;
    applyTagFilterValue({
      mode: tagFilterValue.mode,
      tags: [...tagFilterValue.tags, ...node.tags],
    });
  };

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

    select(media);

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
      openFolder(node.path);
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

  // ===== お気に入り =====

  const favCtx = useFavoritesContext();

  // お気に入り登録/解除
  const handleToggleFavorite = (node: MediaNode) => {
    try {
      favCtx.toggleFavorite(node.path);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // レーティング更新
  const handleChangeRating = (node: MediaNode, rating: number | null) => {
    try {
      favCtx.updateFavorite(node.path, rating);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // ===== 選択 =====

  const { isSelectionMode, selected, select, selectAll, resetSelection } =
    useSelectionControl({
      allNodes,
      controlledNodes: filteredNodes,
    });

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

  const handleEditTags = (node: MediaNode) => {
    select(node);
    handleOpenTagEditor();
  };

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

  // ===== リネーム =====

  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const isRenameMode = !!renameTarget;

  // リネームダイアログを開く
  const handleOpenRenameDialog = (node: MediaNode) => {
    setRenameTarget(node);
  };

  // 後始末
  const handleRenameDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRenameTarget(null);
    }
  };

  // ===== フォルダ作成 =====

  const [folderDir, setFolderDir] = useState<string | null>(null);
  const isCreateFolderMode = !!folderDir;

  // フォルダ作成ダイアログを開く
  const handleOpenCreateFolderDialog = () => {
    setFolderDir(listing.path);
  };

  // 後始末
  const handleCreateFolderDialogOpenChange = (open: boolean) => {
    if (!open) {
      setFolderDir(null);
    }
  };

  // ===== 移動 =====

  // 移動対象のノードリストを管理
  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);
  const isMoveMode = moveTargets.length > 0;
  const initialMoveDialogDirPath =
    moveTargets.length > 0 ? dirname(moveTargets[0]?.path) : undefined;

  // 移動ダイアログを開く（単体）
  const handleOpenMoveDialogSingle = (node: MediaNode) => {
    setMoveTargets([node]);
  };

  // 移動ダイアログを開く（選択）
  const handleOpenMoveDialogSelected = () => {
    setMoveTargets(selected);
  };

  // 後始末
  const handleMoveDialogOpenChange = (open: boolean) => {
    if (!open) {
      setMoveTargets([]);
      if (isSelectionMode) resetSelection();
    }
  };

  // ===== コピー =====

  // 移動対象のノードリストを管理
  const [copyTargets, setCopyTargets] = useState<MediaNode[]>([]);
  const isCopyMode = copyTargets.length > 0;
  const initialCopyDialogDirPath =
    copyTargets.length > 0 ? dirname(copyTargets[0]?.path) : undefined;

  // コピーダイアログを開く（単体）
  const handleOpenCopyDialogSingle = (node: MediaNode) => {
    setCopyTargets([node]);
  };

  // コピーダイアログを開く（選択）
  const handleOpenCopyDialogSelected = () => {
    setCopyTargets(selected);
  };

  // 後始末
  const handleCopyDialogOpenChange = (open: boolean) => {
    if (!open) {
      setCopyTargets([]);
      if (isSelectionMode) resetSelection();
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
    setDeleteTargets(selected);
  };

  // 削除実行
  const handleDeleteDialogConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムをゴミ箱に移動しました`);
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

  // ===== プレビュー設定 =====

  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const isFolderPreviewMode = previewPath != null;

  // プレビュー設定ダイアログを開く
  const handleOpenApplyPreviewDialog = (node: MediaNode) => {
    setPreviewPath(node.path);
  };

  // 後始末
  const handleApplyPreviewDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPreviewPath(null);
    }
  };

  // ===== サムネイル =====

  // サムネイル自動作成
  useEffect(() => {
    if (listing.path) {
      void enqueueCreateThumbsJobAction(listing.path);
    }
  }, [listing.path]);

  // サムネイル更新
  const handleUpdateThumb = (node: MediaNode) => {
    // サムネイルを再作成（強制）
    void enqueueCreateSingleThumbJobAction(node.path, { force: true });

    // DBのタイムスタンプを更新（サムネイルのキャッシュを上書き）
    void touchMediaTimestampAction(node.path).then((res) => {
      if (res.error) toast.error(res.error);
    });

    // プレビュー設定を解除
    void updatePreviewAction(node.path, null).then((res) => {
      if (res.error) toast.error(res.error);
    });

    // ブラウザキャッシュ更新のため、一時的にタイムスタンプを変更
    node.mtime = new Date();
  };

  // ===== ショートカット =====

  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // ショートカット利用可能スコープ
  const allScopes = useMemo(
    () => ["explorer", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  // 現在のスコープ
  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isRenameMode || isMoveMode || isDeleteMode) return "dialog";
    else if (isTagEditMode) return "tag-editor";
    else if (isViewerMode) return "viewer";
    else return "explorer";
  }, [isDeleteMode, isMoveMode, isRenameMode, isTagEditMode, isViewerMode]);

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
  useHotkeys("escape", () => resetSelection(), {
    scopes: "explorer",
  });

  // Delete: 削除
  useHotkeys("delete", () => handleOpenDeleteDialogSelected(), {
    scopes: "explorer",
  });

  // T: タグエディタ
  useHotkeys("t", () => handleToggleTagEditMode(), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  // Ctrl + A: 全選択
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll();
    },
    { scopes: ["explorer", "tag-editor"] }
  );

  // Ctrl + K: 検索
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "explorer" }
  );

  // F2: リネーム
  useHotkeys("f2", () => setRenameTarget(selected[0]), {
    scopes: ["explorer", "viewer"],
  });

  // P/N: 前/次のフォルダを開く
  useHotkeys("p", () => handleOpenPrevFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });
  useHotkeys("n", () => handleOpenNextFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  // ===== その他 =====

  // モバイル判定
  const isMobile = useIsMobile();

  return (
    <PagingProvider totalItems={filteredNodes.length} defaultPageSize={48}>
      <MediaActionsProvider
        actions={{
          onOpen: handleOpen,
          onOpenNextFolder: () => handleOpenNextFolder(),
          onOpenPrevFolder: () => handleOpenPrevFolder(),
          onOpenInNewTab: handleOpenInNewTab,
          onChangeRating: handleChangeRating,
          onToggleFavorite: handleToggleFavorite,
          onRename: handleOpenRenameDialog,
          onMove: handleOpenMoveDialogSingle,
          onCopy: handleOpenCopyDialogSingle,
          onDelete: handleOpenDeleteDialogSingle,
          onEditTags: handleEditTags,
          onAddTagFilter: handleAddTagFilter,
          onSetAsPreview: handleOpenApplyPreviewDialog,
          onUpdateThumb: handleUpdateThumb,
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

              {/* 種別フィルター */}
              <MediaTypeFilterMultiSelect
                value={mediaTypeFilterValue}
                onChange={applyMediaTypeFilterValue}
                displayTypes={["image", "video", "audio"]}
              />

              {/* お気に入りフィルター */}
              <FavoriteFilterSelect
                value={favoriteFilterValue}
                onChange={applyFavoriteFilterValue}
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
          {viewMode === "grid" && !isViewerMode && (
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
          {viewMode === "list" && !isViewerMode && (
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
                    toggleFavorite: true,
                    changeRating: true,
                    delete: true,
                    deletePermanently: false,
                    editTags: true,
                    openNextFolder: true,
                    openParentFolder: false,
                    openPrevFolder: true,
                    restore: false,
                    toggleFullscreen: true,
                  },
                }}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
          <SelectionBar
            open={isSelectionMode && !isTagEditMode && !isMoveMode}
            count={selected.length}
            totalCount={filteredNodes.length}
            onSelectAll={selectAll}
            onClose={resetSelection}
            className="z-40" // DropdownMenu より小さくする
            actions={
              <div className="flex gap-1 items-center">
                {/* メインのアクション */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleOpenTagEditor}
                  disabled={selected.length === 0}
                >
                  <TagIcon size={18} />
                </Button>

                {/* その他のアクション */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleOpenMoveDialogSelected}>
                      <FolderInput className="mr-2 h-4 w-4" /> 移動
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleOpenCopyDialogSelected}>
                      <Copy className="mr-2 h-4 w-4" /> コピー
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleOpenDeleteDialogSelected}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> 削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />

          {/* タグエディター */}
          <TagEditSheet
            open={isTagEditMode}
            targetNodes={selected}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
            opacity={tagEditMode === "default" ? 100 : 0}
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

          {/* 削除警告ダイアログ */}
          <DeleteAlertDialog
            open={isDeleteMode}
            onConfirm={handleDeleteDialogConfirm}
            onOpenChange={handleDeleteDialogOpenChange}
            count={deleteTargets.length}
          />

          {/* プレビュー設定ダイアログ */}
          <ApplyPreviewDialog
            open={isFolderPreviewMode}
            onOpenChange={handleApplyPreviewDialogOpenChange}
            previewPath={previewPath}
          />

          {/* フォルダナビゲーション */}
          <FolderNavigation prevPath={listing.prev} nextPath={listing.next} />
        </div>
      </MediaActionsProvider>
    </PagingProvider>
  );
}
