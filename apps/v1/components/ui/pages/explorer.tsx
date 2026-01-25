"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { deleteNodesAction } from "@/actions/media-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoriteFilterButton } from "@/components/ui/buttons/favorite-filter-button";
import { DeleteConfirmDialog } from "@/components/ui/dialogs/delete-confirm-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { TagFilterMode, useTagFilter } from "@/hooks/use-tag-filter";
import {
  createFavoriteFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
  MediaPathToNodeMap,
} from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { unique } from "@/lib/utils/unique";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
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
import { AnimatePresence } from "framer-motion";
import { FolderInput, MoreVertical, TagIcon, Trash2 } from "lucide-react";
import { dirname } from "path";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view);
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const patch: Partial<ExplorerQuery> = {};

    // undefined と空文字列の比較にならないように normalize しておく
    const nq = q ?? "";
    const nQuery = query ?? "";

    if (view !== viewMode) patch.view = viewMode;
    if (nq !== nQuery) patch.q = nQuery || undefined;

    if (Object.keys(patch).length === 0) return;

    setExplorerQuery(patch);
  }, [setExplorerQuery, q, query, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeExplorerQuery();

  // ===== フィルタリング =====

  // タグフィルタ
  const tagFilter = useTagFilter();

  const handleApplyTagFilter = (
    tags: Iterable<string>,
    mode: TagFilterMode
  ) => {
    tagFilter.selectTags(tags);
    tagFilter.setMode(mode);
  };

  // お気に入りのみ有効フラグ
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);
  const toggleIsFavoriteOnly = () => setIsFavoriteOnly((prev) => !prev);

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);
  const tagFilterFn = useMemo(
    () => createTagFilter(Array.from(tagFilter.selectedTags), tagFilter.mode),
    [tagFilter]
  );
  const favoriteFilterFn = useMemo(
    () => createFavoriteFilter(isFavoriteOnly),
    [isFavoriteOnly]
  );

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      searchFilterFn,
      tagFilterFn,
      favoriteFilterFn,
    ];

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) {
        // フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilterFn(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, searchFilterFn, tagFilterFn, favoriteFilterFn]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // 「メディアのみ」のタグリスト
  const mediaOnlyTags = useMemo(
    () =>
      sortNames(
        unique(
          mediaOnly
            .filter((n) => n.tags && n.tags.length > 0)
            .flatMap((n) => n.tags!.map((t) => t.name))
        )
      ),
    [mediaOnly]
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

  const handleToggleFavorite = (node: MediaNode) => {
    try {
      void favCtx.toggleFavorite(node.path);
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

  // 処理高速化のため、path => node の Map を作成しておく
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
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };
  const handleToggleTagEditor = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

  // ===== リネーム =====

  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const isRenameMode = !!renameTarget;

  const handleRenameSingle = (node: MediaNode) => {
    setRenameTarget(node);
  };

  // ===== 移動 (Move) =====

  // 移動対象のノードリストを管理
  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);
  const isMoveMode = moveTargets.length > 0;
  const initialDirPath =
    moveTargets.length > 0 ? dirname(moveTargets[0]?.path) : undefined;

  const handleCloseMoveDialog = () => {
    setMoveTargets([]);
    if (isSelectionMode) handleClearSelection();
  };

  // 単体移動の呼び出し
  const handleOpenMoveSingle = (node: MediaNode) => {
    setMoveTargets([node]);
  };

  // 一括移動の呼び出し
  const handleOpenMoveSelected = () => {
    setMoveTargets(selected);
  };

  // ===== 削除 (Delete) =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 削除実行
  const handleDeleteConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムをゴミ箱に移動しました`);
      clearSelection(); // 選択中だった場合は解除
    } else {
      toast.error(`${result.failed}件の削除に失敗しました`);
    }
  };

  // 単体削除の呼び出し用
  const handleOpenDeleteSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 一括削除の呼び出し用 (SelectionBarから)
  const handleOpenDeleteSelected = () => {
    setDeleteTargets(selected);
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

  // ===== その他 =====

  // ショートカット
  useShortcutKeys([
    { key: "t", callback: () => handleToggleTagEditor() },
    { key: "Ctrl+a", callback: () => handleSelectAll() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => handleClearSelection() },
    { key: "F2", callback: () => setRenameTarget(selected[0] ?? null) },
  ]);

  // スクロール対象のref
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
      )}
      ref={scrollRef}
      tabIndex={-1}
    >
      <div className="flex flex-wrap items-center gap-1 px-4">
        {/* タグフィルター */}
        <TagFilterDialog
          tags={mediaOnlyTags}
          selectedTags={tagFilter.selectedTags}
          currentMode={tagFilter.mode}
          onApply={handleApplyTagFilter}
        />

        {/* お気に入りフィルター */}
        <FavoriteFilterButton
          isActive={isFavoriteOnly}
          onClick={toggleIsFavoriteOnly}
          showCount
          count={mediaOnly.length}
        />
      </div>

      {/* グリッドビュー */}
      {viewMode === "grid" && !isViewMode && (
        <PagingProvider totalItems={filteredNodes.length} defaultPageSize={48}>
          <div className="flex-1">
            <PagingGridView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onFavorite={handleToggleFavorite}
              onRename={handleRenameSingle}
              onMove={handleOpenMoveSingle}
              onDelete={handleOpenDeleteSingle}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onPageChange={() =>
                scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
              }
              onScrollRestored={() => setLastPath(null)}
            />
          </div>
        </PagingProvider>
      )}

      {/* リストビュー */}
      {viewMode === "list" && !isViewMode && (
        <PagingProvider totalItems={filteredNodes.length} defaultPageSize={100}>
          <div className="flex-1">
            <PagingListView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onFavorite={handleToggleFavorite}
              onRename={handleRenameSingle}
              onMove={handleOpenMoveSingle}
              onDelete={handleOpenDeleteSingle}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onPageChange={() =>
                scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
              }
              onScrollRestored={() => setLastPath(null)}
            />
          </div>
        </PagingProvider>
      )}

      {/* ビューワ */}
      {isViewMode && (
        <ScrollLockProvider>
          <MediaViewer
            allNodes={mediaOnly}
            initialIndex={viewerIndex}
            onIndexChange={handleViewerIndexChange}
            onClose={closeViewer}
            onPrevFolder={
              listing.prev ? (at) => openPrevFolder(at ?? "last") : undefined
            }
            onNextFolder={
              listing.next ? (at) => openNextFolder(at ?? "first") : undefined
            }
            onEditTags={handleToggleTagEditor}
            onDelete={handleOpenDeleteSelected}
          />
        </ScrollLockProvider>
      )}

      {/* 選択バー */}
      <AnimatePresence>
        {isSelectionMode && !isTagEditMode && !isMoveMode && (
          <SelectionBar
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

                {/* その他 */}
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
        )}
      </AnimatePresence>

      {/* タグエディター */}
      <AnimatePresence>
        {isTagEditMode && (
          <TagEditSheet
            targetNodes={selected}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
            opacity={tagEditMode === "default" ? 100 : 0}
          />
        )}
      </AnimatePresence>

      {/* リネームダイアログ */}
      <RenameDialog
        open={isRenameMode}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        sourcePath={renameTarget?.path ?? ""}
        currentName={renameTarget?.name ?? ""}
      />

      {/* 移動ダイアログ */}
      <MoveDialog
        open={isMoveMode}
        onOpenChange={(open) => !open && handleCloseMoveDialog()}
        sourceNodes={moveTargets.map((node) => ({
          path: node.path,
          name: node.name,
        }))}
        initialDirPath={initialDirPath}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={isDeleteMode}
        onOpenChange={(open) => !open && setDeleteTargets([])}
        count={deleteTargets.length}
        onConfirm={handleDeleteConfirm}
      />

      {/* フォルダナビゲーション */}
      <FolderNavigation prevHref={listing.prev} nextHref={listing.next} />
    </div>
  );
}
