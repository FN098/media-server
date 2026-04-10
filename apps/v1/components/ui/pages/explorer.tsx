"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { deleteNodesAction } from "@/actions/media-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FilterResetButton } from "@/components/ui/buttons/filter-reset-button";
import { DeleteConfirmDialog } from "@/components/ui/dialogs/delete-confirm-dialog";
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
import {
  createMediaTypeFilter,
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
  MediaPathToNodeMap,
  MediaTypeFilterValue,
} from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useTagFilterContext } from "@/providers/tag-filter-provider";
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
  ArrowDown10,
  ArrowDownAz,
  ArrowDownZa,
  CalendarArrowDown,
  FolderInput,
  MoreVertical,
  TagIcon,
  Trash2,
} from "lucide-react";
import { dirname } from "path";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // ===== フィルタリング =====

  // タグフィルタ
  const tagFilter = useTagFilterContext();

  // 最小レーティングフィルタ
  const [minRating, setMinRating] = useState<number>(0);

  // 種類フィルタ
  const [mediaTypeFilterValue, setMediaTypeFilterValue] =
    useState<MediaTypeFilterValue>("all");

  // フィルタリセット
  const handleResetFilters = () => {
    tagFilter.selectTags([]);
    tagFilter.setMode("AND");
    setMinRating(0);
    setMediaTypeFilterValue("all");
  };

  // フィルターが一つでも適用されているかチェック
  const isFiltered =
    tagFilter.selectedCount > 0 ||
    tagFilter.mode !== "AND" ||
    minRating > 0 ||
    minRating === -1 ||
    mediaTypeFilterValue !== "all";

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);
  const tagFilterFn = useMemo(
    () =>
      createTagFilter(
        tagFilter.selectedTags.map((t) => t.name),
        tagFilter.mode
      ),
    [tagFilter]
  );
  const ratingFilterFn = useMemo(
    () => createRatingFilter(minRating),
    [minRating]
  );
  const mediaTypeFilterFn = useMemo(
    () => createMediaTypeFilter(mediaTypeFilterValue),
    [mediaTypeFilterValue]
  );

  const allNodes = listing.nodes;

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      mediaTypeFilterFn,
      ratingFilterFn,
      searchFilterFn,
      tagFilterFn,
    ];

    // フィルタの適用
    return allNodes.filter((node) => {
      return filters.every((fn) => fn(node));
    });
  }, [
    mediaTypeFilterFn,
    ratingFilterFn,
    searchFilterFn,
    tagFilterFn,
    allNodes,
  ]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // ===== ビューア =====

  // ビューア用インデックスを計算するためのマップ
  const viewerIndexMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // ビューア用インデックスを取得
  const getViewerIndex = useCallback(
    (path: string) => {
      if (viewerIndexMap.has(path)) return viewerIndexMap.get(path)!;
      return null;
    },
    [viewerIndexMap]
  );

  // ビューア用インデックス
  const viewerIndex = useMemo(
    () => (at != null ? normalizeIndex(at, mediaOnly.length) : null),
    [at, mediaOnly.length]
  );

  // ビューア起動モード
  const isViewMode = modal && viewerIndex != null && !!mediaOnly[viewerIndex];

  // 直前のインデックス
  const [lastPath, setLastPath] = useState<string | null>(null);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;
    selectPaths([media.path]);
    setLastPath(media.path);
  };

  // 前のフォルダを開く
  const handleOpenPrevFolder = (at: IndexLike = "last") => {
    openPrevFolder(at);
  };

  // 次のフォルダを開く
  const handleOpenNextFolder = (at: IndexLike = "first") => {
    openNextFolder(at);
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

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // O(1) で path => node を検索するための Map
  const pathToNodeMap: MediaPathToNodeMap = useMemo(() => {
    return new Map(listing.nodes.map((node) => [node.path, node]));
  }, [listing.nodes]);

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = pathToNodeMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [pathToNodeMap, selectedPaths]);

  // 選択
  const handleSelectSingle = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  // 全選択
  const handleSelectAll = () => {
    selectPaths(filteredNodes.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const handleClearSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  // 選択バー閉じる
  const handleCloseSelectionBar = () => {
    clearSelection();
    exitSelectionMode();
  };

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

  // タグエディタを表示
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };

  // タグエディタを非表示
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };

  // タグエディタを表示/非表示
  const handleToggleTagEditor = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // ===== リネーム =====

  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const isRenameMode = !!renameTarget;

  // 単体リネーム
  const handleRenameSingle = (node: MediaNode) => {
    setRenameTarget(node);
  };

  // 後始末
  const handleRenameDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRenameTarget(null);
    }
  };

  // ===== 移動 (Move) =====

  // 移動対象のノードリストを管理
  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);
  const isMoveMode = moveTargets.length > 0;
  const initialDirPath =
    moveTargets.length > 0 ? dirname(moveTargets[0]?.path) : undefined;

  // 単体移動
  const handleOpenMoveSingle = (node: MediaNode) => {
    setMoveTargets([node]);
  };

  // 一括移動
  const handleOpenMoveSelected = () => {
    setMoveTargets(selected);
  };

  // 後始末
  const handleMoveDialogOpenChange = (open: boolean) => {
    if (!open) {
      setMoveTargets([]);
      if (isSelectionMode) handleClearSelection();
    }
  };

  // ===== 削除 (Delete) =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 単体削除
  const handleOpenDeleteSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 一括削除
  const handleOpenDeleteSelected = () => {
    setDeleteTargets(selected);
  };

  // 削除実行
  const handleDeleteConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムをゴミ箱に移動しました`);
      clearSelection();
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

  // ===== サーバーアクション =====

  // サムネイル作成リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void enqueueThumbJob(listing.path);
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
    () => ["explorer-main", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  // 現在のスコープ
  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isRenameMode || isMoveMode || isDeleteMode) return "dialog";
    else if (isTagEditMode) return "tag-editor";
    else if (isViewMode) return "viewer";
    else return "explorer-main";
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
  useHotkeys("escape", () => handleClearSelection(), {
    scopes: "explorer-main",
  });
  useHotkeys("delete", () => handleOpenDeleteSelected(), {
    scopes: "explorer-main",
  });
  useHotkeys("t", () => handleToggleTagEditor(), {
    scopes: ["explorer-main", "viewer", "tag-editor"],
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      handleSelectAll();
    },
    { scopes: ["explorer-main", "tag-editor"] }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "explorer-main" }
  );
  useHotkeys("f2", () => setRenameTarget(selected[0]), {
    scopes: ["explorer-main", "viewer"],
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
                  key: "name",
                  direction: "desc",
                  label: "名前順 (Z-A)",
                  icon: ArrowDownZa,
                },
                {
                  key: "rating",
                  direction: "desc",
                  label: "評価が高い順",
                  icon: ArrowDown10,
                },
                {
                  key: "mtime",
                  direction: "desc",
                  label: "更新日が新しい順",
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
              value={minRating}
              onChange={setMinRating}
              showUnrated
            />

            {/* タグフィルター */}
            <TagFilterDialog />

            {/* リセットボタン */}
            <FilterResetButton
              onReset={handleResetFilters}
              isVisible={isFiltered}
            />
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
            <PagingGridView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onRatingChange={(node, rating) =>
                void handleRatingChange(node, rating)
              }
              onRename={handleRenameSingle}
              onMove={handleOpenMoveSingle}
              onDelete={handleOpenDeleteSingle}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onScrollRestored={() => setLastPath(null)}
            />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && !isViewMode && (
          <div className="flex-1">
            <PagingListView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onRatingChange={(node, rating) =>
                void handleRatingChange(node, rating)
              }
              onRename={handleRenameSingle}
              onMove={handleOpenMoveSingle}
              onDelete={handleOpenDeleteSingle}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onScrollRestored={() => setLastPath(null)}
            />
          </div>
        )}

        {/* ビューワ */}
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={viewerIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onPrevFolder={listing.prev ? handleOpenPrevFolder : undefined}
              onNextFolder={listing.next ? handleOpenNextFolder : undefined}
              onEditTags={handleToggleTagEditor}
              onDelete={handleOpenDeleteSelected}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <SelectionBar
          open={isSelectionMode && !isTagEditMode && !isMoveMode}
          count={selected.length}
          totalCount={filteredNodes.length}
          onSelectAll={handleSelectAll}
          onClose={handleCloseSelectionBar}
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
                  <DropdownMenuItem onClick={handleOpenMoveSelected}>
                    <FolderInput className="mr-2 h-4 w-4" /> 移動
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleOpenDeleteSelected}
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
          key={renameTarget?.path} // 初期入力値リセットのため
          open={isRenameMode}
          onOpenChange={handleRenameDialogOpenChange}
          sourcePath={renameTarget?.path ?? ""}
          currentName={renameTarget?.name ?? ""}
        />

        {/* 移動ダイアログ */}
        <MoveDialog
          open={isMoveMode}
          onOpenChange={handleMoveDialogOpenChange}
          sourceNodes={moveTargets}
          initialDirPath={initialDirPath}
        />

        {/* 削除確認ダイアログ */}
        <DeleteConfirmDialog
          open={isDeleteMode}
          onConfirm={handleDeleteConfirm}
          onOpenChange={handleDeleteDialogOpenChange}
          count={deleteTargets.length}
        />

        {/* フォルダナビゲーション */}
        <FolderNavigation prevHref={listing.prev} nextHref={listing.next} />
      </div>
    </PagingProvider>
  );
}
