"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { deleteNodesAction } from "@/actions/media-actions";
import { enqueueCreateThumbsJobAction } from "@/actions/thumb-actions";
import { DeleteAlertDialog } from "@/components/ui/alert-dialogs/delete-alert-dialog";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FilterResetButton } from "@/components/ui/buttons/filter-reset-button";
import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { MediaTypeFilterSelect } from "@/components/ui/selects/media-type-filter-select";
import { RatingFilterSelect } from "@/components/ui/selects/rating-filter-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { useFilters } from "@/hooks/use-filters";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { ActionsProvider } from "@/providers/actions-provider";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
  } = useExplorerContext();

  // 前のフォルダを開く
  const handleOpenPrevFolder = (at: IndexLike = "last") => {
    openPrevFolder(at);
  };

  // 次のフォルダを開く
  const handleOpenNextFolder = (at: IndexLike = "first") => {
    openNextFolder(at);
  };

  // ===== URL ステート =====

  // URLファーストのステート管理
  const { explorerQuery, setExplorerQuery } = useExplorerQuery();
  const { view, q, at, modal } = explorerQuery; // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view ?? "grid");
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const hasChanged =
      query.trim() !== (q || "") || viewMode !== (view || "grid");

    if (hasChanged) {
      setExplorerQuery({
        q: query.trim() === "" ? undefined : query,
        view: viewMode === "grid" ? undefined : viewMode,
      });
    }
  }, [setExplorerQuery, query, viewMode, q, view]);

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

  const {
    mediaTypeFilterValue,
    setMediaTypeFilterValue,
    ratingFilter,
    setRatingFilter,
    filteredNodes,
    mediaOnly,
    isFiltered,
    addTagFilter,
    resetFilters,
  } = useFilters({
    allNodes,
    query,
    activated: true,
  });

  // ===== ビューア =====

  const { initialIndex, getViewerIndex, isViewMode } = useViewerControl({
    mediaOnly,
    at,
    modal,
  });

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

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }

    if (isMedia(node.type)) {
      const index = getViewerIndex(node.path);
      if (index == null) return;
      openViewer(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // ===== お気に入り =====

  const favCtx = useFavoritesContext();

  // レーティング更新
  const handleRatingChange = async (node: MediaNode, rating: number | null) => {
    try {
      await favCtx.updateFavorite(node.path, rating);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // ===== 選択機能 =====

  const { isSelectionMode, selected, select, selectAll, resetSelection } =
    useSelectionControl({
      allNodes,
      controlledNodes: filteredNodes,
    });

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

  // タグエディタを開く
  const openTagEditor = () => {
    setIsTagEditMode(true);
  };

  // タグエディタを閉じる
  const closeTagEditor = () => {
    setIsTagEditMode(false);
  };

  // タグエディタを表示/非表示
  const toggleTagEditMode = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // ===== リネーム =====

  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const isRenameMode = !!renameTarget;

  // リネームダイアログを開く（単体）
  const openRenameDialogSingle = (node: MediaNode) => {
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
  const openCreateFolderDialog = () => {
    setFolderDir(listing.path);
  };

  // 後始末
  const handleCreateFolderDialogOpenChange = (open: boolean) => {
    if (!open) {
      setFolderDir(null);
    }
  };

  // ===== 移動 (Move) =====

  // 移動対象のノードリストを管理
  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);
  const isMoveMode = moveTargets.length > 0;
  const initialMoveDialogDirPath =
    moveTargets.length > 0 ? dirname(moveTargets[0]?.path) : undefined;

  // 移動ダイアログを開く（単体）
  const openMoveDialogSingle = (node: MediaNode) => {
    setMoveTargets([node]);
  };

  // 移動ダイアログを開く（選択）
  const openMoveDialogSelected = () => {
    setMoveTargets(selected);
  };

  // 後始末
  const handleMoveDialogOpenChange = (open: boolean) => {
    if (!open) {
      setMoveTargets([]);
      if (isSelectionMode) resetSelection();
    }
  };

  // ===== コピー (Copy) =====

  // 移動対象のノードリストを管理
  const [copyTargets, setCopyTargets] = useState<MediaNode[]>([]);
  const isCopyMode = copyTargets.length > 0;
  const initialCopyDialogDirPath =
    copyTargets.length > 0 ? dirname(copyTargets[0]?.path) : undefined;

  // コピーダイアログを開く（単体）
  const openCopyDialogSingle = (node: MediaNode) => {
    setCopyTargets([node]);
  };

  // コピーダイアログを開く（選択）
  const openCopyDialogSelected = () => {
    setCopyTargets(selected);
  };

  // 後始末
  const handleCopyDialogOpenChange = (open: boolean) => {
    if (!open) {
      setCopyTargets([]);
      if (isSelectionMode) resetSelection();
    }
  };

  // ===== 削除 (Delete) =====

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
  const performDelete = async () => {
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
  const openApplyPreviewDialog = (node: MediaNode) => {
    setPreviewPath(node.path);
  };

  // 後始末
  const handleApplyPreviewDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPreviewPath(null);
    }
  };

  // ===== サーバーアクション =====

  // サムネイル作成リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void enqueueCreateThumbsJobAction(listing.path);
    }
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void visitFolderAction(listing.path);
    }
  }, [listing.path]);

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
    else if (isViewMode) return "viewer";
    else return "explorer";
  }, [isDeleteMode, isMoveMode, isRenameMode, isTagEditMode, isViewMode]);

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
  // T: タグエディタ
  // Ctrl + A: 全選択
  // Ctrl + K: 検索
  // F2: リネーム
  // P/N: 前/次のフォルダを開く
  useHotkeys("escape", () => resetSelection(), {
    scopes: "explorer",
  });
  useHotkeys("delete", () => openDeleteDialogSelected(), {
    scopes: "explorer",
  });
  useHotkeys("t", () => toggleTagEditMode(), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll();
    },
    { scopes: ["explorer", "tag-editor"] }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "explorer" }
  );
  useHotkeys("f2", () => setRenameTarget(selected[0]), {
    scopes: ["explorer", "viewer"],
  });
  useHotkeys("p", () => handleOpenPrevFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });
  useHotkeys("n", () => handleOpenNextFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  // ===== その他 =====

  // スクロール対象のref
  const scrollRef = useRef<HTMLDivElement>(null);

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
        ref={scrollRef}
        tabIndex={-1}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-[repeat(6,180px)] gap-2 flex-grow">
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

            {/* 種別フィルター */}
            <MediaTypeFilterSelect
              value={mediaTypeFilterValue}
              onChange={setMediaTypeFilterValue}
              excludeTypes={["file"]}
            />

            {/* 評価フィルター */}
            <RatingFilterSelect
              value={ratingFilter}
              onChange={setRatingFilter}
              showUnrated
            />

            {/* タグフィルター */}
            <TagFilterDialog />

            {/* 新規フォルダ作成 */}
            <Button variant="outline" onClick={openCreateFolderDialog}>
              <FolderPlus className="h-4 w-4" />
              新規フォルダ
            </Button>

            {/* リセット */}
            <FilterResetButton onReset={resetFilters} isVisible={isFiltered} />
          </div>

          {/* フィルター結果 */}
          <FilterResultText
            totalCount={allNodes.length}
            filteredCount={filteredNodes.length}
            isFiltered={isFiltered}
            className="ml-auto min-w-[120px] text-right"
          />
        </div>

        {/* グリッドビュー */}
        {viewMode === "grid" && !isViewMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                changeRating: handleRatingChange,
                rename: openRenameDialogSingle,
                move: openMoveDialogSingle,
                copy: openCopyDialogSingle,
                delete: openDeleteDialogSingle,
                editTags: (node: MediaNode) => {
                  select(node);
                  openTagEditor();
                },
                addTagFilter,
                setAsPreview: openApplyPreviewDialog,
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
        {viewMode === "list" && !isViewMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                changeRating: handleRatingChange,
                rename: openRenameDialogSingle,
                move: openMoveDialogSingle,
                copy: openCopyDialogSingle,
                delete: openDeleteDialogSingle,
                editTags: (node: MediaNode) => {
                  select(node);
                  openTagEditor();
                },
                addTagFilter,
                setAsPreview: openApplyPreviewDialog,
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
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={initialIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onPrevFolder={listing.prev ? handleOpenPrevFolder : undefined}
              onNextFolder={listing.next ? handleOpenNextFolder : undefined}
              onEditTags={toggleTagEditMode}
              onDelete={openDeleteDialogSelected}
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
                onClick={openTagEditor}
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
                  <DropdownMenuItem onClick={openMoveDialogSelected}>
                    <FolderInput className="mr-2 h-4 w-4" /> 移動
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={openCopyDialogSelected}>
                    <Copy className="mr-2 h-4 w-4" /> コピー
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={openDeleteDialogSelected}
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
          onClose={closeTagEditor}
          mode={tagEditMode}
          opacity={tagEditMode === "default" ? 100 : 0}
        />

        {/* リネームダイアログ */}
        <RenameDialog
          open={isRenameMode}
          onOpenChange={handleRenameDialogOpenChange}
          sourcePath={renameTarget?.path ?? ""}
          currentName={renameTarget?.name ?? ""}
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
          onConfirm={performDelete}
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
        <FolderNavigation prevHref={listing.prev} nextHref={listing.next} />
      </div>
    </PagingProvider>
  );
}
